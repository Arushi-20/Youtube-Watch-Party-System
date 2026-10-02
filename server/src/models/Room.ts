import { Participant } from './Participant.js';
import {
  UserRole,
  PlayState,
  VideoState,
  ParticipantData,
  SyncStatePayload,
  ChatMessage,
  ControlRequest,
} from '../types/index.js';

export class Room {
  public readonly id: string;
  public name: string;
  private participants: Map<string, Participant> = new Map(); // userId -> Participant
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId
  private videoState: VideoState;
  private chatMessages: ChatMessage[] = [];
  private controlRequests: Map<string, ControlRequest> = new Map();
  public readonly createdAt: number;

  // Default video: Blender Open Movie Project "Big Buck Bunny" or Lo-Fi Beats
  private static DEFAULT_VIDEO_ID = 'jfKfPfyJRdk'; // lofi hip hop radio - beats to relax/study to

  constructor(id: string, name?: string, initialVideoId?: string) {
    this.id = id;
    this.name = name || `Party Room ${id}`;
    this.createdAt = Date.now();
    this.videoState = {
      videoId: initialVideoId || Room.DEFAULT_VIDEO_ID,
      playState: 'paused',
      currentTime: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get current synchronized video playback time
   * Calculates time elapsed if video is currently playing
   */
  public getCurrentPlaybackTime(): number {
    if (this.videoState.playState === 'playing') {
      const elapsedSeconds = (Date.now() - this.videoState.lastUpdated) / 1000;
      return Math.max(0, this.videoState.currentTime + elapsedSeconds);
    }
    return this.videoState.currentTime;
  }

  /**
   * Get sync state payload
   */
  public getSyncState(): SyncStatePayload {
    return {
      playState: this.videoState.playState,
      currentTime: parseFloat(this.getCurrentPlaybackTime().toFixed(2)),
      videoId: this.videoState.videoId,
    };
  }

  /**
   * Get participant by user ID
   */
  public getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId);
  }

  /**
   * Get participant by socket ID
   */
  public getParticipantBySocketId(socketId: string): Participant | undefined {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return undefined;
    return this.participants.get(userId);
  }

  /**
   * Get all participants formatted as JSON data
   */
  public getAllParticipants(): ParticipantData[] {
    return Array.from(this.participants.values()).map((p) => p.toJSON());
  }

  /**
   * Check if room has a host
   */
  public getHost(): Participant | undefined {
    for (const p of this.participants.values()) {
      if (p.isHost()) return p;
    }
    return undefined;
  }

  /**
   * Add a participant to the room
   * First user to join automatically becomes Host!
   */
  public addParticipant(userId: string, socketId: string, username: string): Participant {
    const existing = this.participants.get(userId);
    if (existing) {
      // Reconnection of same user
      this.socketToUser.delete(existing.socketId);
      existing.updateSocketId(socketId);
      existing.username = username || existing.username;
      this.socketToUser.set(socketId, userId);
      return existing;
    }

    // Determine initial role
    const isFirstParticipant = this.participants.size === 0;
    const initialRole: UserRole = isFirstParticipant ? 'host' : 'participant';

    const participant = new Participant(userId, socketId, username, initialRole);
    this.participants.set(userId, participant);
    this.socketToUser.set(socketId, userId);

    return participant;
  }

  /**
   * Remove a participant from the room
   * Automatically passes Host role to another member if Host leaves
   */
  public removeParticipant(userId: string): { removed: Participant; newHost?: Participant } | null {
    const participant = this.participants.get(userId);
    if (!participant) return null;

    this.participants.delete(userId);
    this.socketToUser.delete(participant.socketId);
    this.controlRequests.delete(userId);

    let newHost: Participant | undefined = undefined;

    // If host left, elect a new host
    if (participant.isHost() && this.participants.size > 0) {
      // Prioritize moderators, then first participant
      const remaining = Array.from(this.participants.values());
      const mod = remaining.find((p) => p.isModerator());
      newHost = mod || remaining[0];
      newHost.setRole('host');
    }

    return { removed: participant, newHost };
  }

  /**
   * Assign a role to a participant
   * Host only
   */
  public assignRole(
    requesterId: string,
    targetUserId: string,
    newRole: UserRole
  ): { success: boolean; error?: string } {
    const requester = this.participants.get(requesterId);
    if (!requester || !requester.isHost()) {
      return { success: false, error: 'Only the host can assign roles' };
    }

    const target = this.participants.get(targetUserId);
    if (!target) {
      return { success: false, error: 'Target user not found in this room' };
    }

    if (target.isHost() && newRole !== 'host') {
      return { success: false, error: 'Cannot demote host directly. Use transfer_host.' };
    }

    if (newRole === 'host') {
      return this.transferHost(requesterId, targetUserId);
    }

    target.setRole(newRole);
    return { success: true };
  }

  /**
   * Transfer host to another user
   * Host only
   */
  public transferHost(requesterId: string, targetUserId: string): { success: boolean; error?: string } {
    const requester = this.participants.get(requesterId);
    if (!requester || !requester.isHost()) {
      return { success: false, error: 'Only the host can transfer host ownership' };
    }

    const target = this.participants.get(targetUserId);
    if (!target) {
      return { success: false, error: 'Target user not found in this room' };
    }

    if (requesterId === targetUserId) {
      return { success: true };
    }

    // Demote current host to moderator and promote target to host
    requester.setRole('moderator');
    target.setRole('host');
    return { success: true };
  }

  /**
   * Remove a participant (Kick)
   * Host only
   */
  public kickParticipant(
    requesterId: string,
    targetUserId: string
  ): { success: boolean; error?: string; targetSocketId?: string } {
    const requester = this.participants.get(requesterId);
    if (!requester || !requester.isHost()) {
      return { success: false, error: 'Only the host can remove participants' };
    }

    if (requesterId === targetUserId) {
      return { success: false, error: 'Host cannot kick themselves' };
    }

    const target = this.participants.get(targetUserId);
    if (!target) {
      return { success: false, error: 'Target user not found in this room' };
    }

    const socketId = target.socketId;
    this.removeParticipant(targetUserId);

    return { success: true, targetSocketId: socketId };
  }

  /**
   * Play playback
   * Requires Host or Moderator
   */
  public play(requesterId: string, currentTime?: number): { success: boolean; error?: string } {
    const participant = this.participants.get(requesterId);
    if (!participant || !participant.canPerform('play')) {
      return { success: false, error: 'Permission denied: Requires Host or Moderator role to play video' };
    }

    if (typeof currentTime === 'number' && currentTime >= 0) {
      this.videoState.currentTime = currentTime;
    }
    this.videoState.playState = 'playing';
    this.videoState.lastUpdated = Date.now();
    return { success: true };
  }

  /**
   * Pause playback
   * Requires Host or Moderator
   */
  public pause(requesterId: string, currentTime?: number): { success: boolean; error?: string } {
    const participant = this.participants.get(requesterId);
    if (!participant || !participant.canPerform('pause')) {
      return { success: false, error: 'Permission denied: Requires Host or Moderator role to pause video' };
    }

    if (typeof currentTime === 'number' && currentTime >= 0) {
      this.videoState.currentTime = currentTime;
    } else {
      this.videoState.currentTime = this.getCurrentPlaybackTime();
    }
    this.videoState.playState = 'paused';
    this.videoState.lastUpdated = Date.now();
    return { success: true };
  }

  /**
   * Periodic playback time sync pulse from Host/Mod
   */
  public updatePlaybackTime(requesterId: string, currentTime: number): boolean {
    const participant = this.participants.get(requesterId);
    if (!participant || !participant.canPerform('play')) {
      return false;
    }

    if (typeof currentTime === 'number' && currentTime >= 0) {
      this.videoState.currentTime = currentTime;
      this.videoState.lastUpdated = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Seek video
   * Requires Host or Moderator
   */
  public seek(requesterId: string, time: number): { success: boolean; error?: string } {
    const participant = this.participants.get(requesterId);
    if (!participant || !participant.canPerform('seek')) {
      return { success: false, error: 'Permission denied: Requires Host or Moderator role to seek video' };
    }

    this.videoState.currentTime = Math.max(0, time);
    this.videoState.lastUpdated = Date.now();
    return { success: true };
  }

  /**
   * Change video
   * Requires Host or Moderator
   */
  public changeVideo(requesterId: string, videoId: string): { success: boolean; error?: string } {
    const participant = this.participants.get(requesterId);
    if (!participant || !participant.canPerform('change_video')) {
      return { success: false, error: 'Permission denied: Requires Host or Moderator role to change video' };
    }

    const cleanVideoId = videoId.trim();
    if (!cleanVideoId) {
      return { success: false, error: 'Invalid video ID or URL' };
    }

    this.videoState.videoId = cleanVideoId;
    this.videoState.currentTime = 0;
    this.videoState.playState = 'playing';
    this.videoState.lastUpdated = Date.now();
    return { success: true };
  }

  /**
   * Add chat message
   */
  public addChatMessage(senderId: string, text: string): ChatMessage | null {
    const participant = this.participants.get(senderId);
    if (!participant) return null;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      senderId: participant.id,
      senderName: participant.username,
      senderRole: participant.role,
      text: text.trim().slice(0, 500),
      timestamp: Date.now(),
    };

    this.chatMessages.push(message);
    if (this.chatMessages.length > 100) {
      this.chatMessages.shift();
    }

    return message;
  }

  public getChatHistory(): ChatMessage[] {
    return [...this.chatMessages];
  }

  /**
   * Request control permission
   */
  public requestControl(userId: string): { request: ControlRequest } | null {
    const participant = this.participants.get(userId);
    if (!participant || participant.isHost() || participant.isModerator()) {
      return null;
    }

    const request: ControlRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: participant.id,
      username: participant.username,
      requestedAt: Date.now(),
    };

    this.controlRequests.set(request.id, request);
    return { request };
  }

  /**
   * Respond to control request
   */
  public respondToControlRequest(
    responderId: string,
    requestId: string,
    approve: boolean
  ): { success: boolean; targetUser?: Participant; error?: string } {
    const responder = this.participants.get(responderId);
    if (!responder || (!responder.isHost() && !responder.isModerator())) {
      return { success: false, error: 'Only Host or Moderator can approve control requests' };
    }

    const request = this.controlRequests.get(requestId);
    if (!request) {
      return { success: false, error: 'Control request expired or not found' };
    }

    this.controlRequests.delete(requestId);
    const targetUser = this.participants.get(request.userId);

    if (approve && targetUser) {
      targetUser.setRole('moderator');
    }

    return { success: true, targetUser };
  }

  /**
   * Check if room is empty
   */
  public isEmpty(): boolean {
    return this.participants.size === 0;
  }
}
