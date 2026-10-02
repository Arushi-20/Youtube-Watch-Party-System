import { UserRole, ParticipantData } from '../types/index.js';

export type ActionType =
  | 'play'
  | 'pause'
  | 'seek'
  | 'change_video'
  | 'assign_role'
  | 'remove_participant'
  | 'transfer_host'
  | 'respond_control'
  | 'chat'
  | 'react'
  | 'request_control';

export class Participant {
  public readonly id: string;
  public socketId: string;
  public username: string;
  public role: UserRole;
  public readonly joinedAt: number;

  constructor(id: string, socketId: string, username: string, role: UserRole = 'participant') {
    this.id = id;
    this.socketId = socketId;
    this.username = username.trim() || 'Anonymous';
    this.role = role;
    this.joinedAt = Date.now();
  }

  /**
   * Set user role (Host only can assign)
   */
  public setRole(role: UserRole): void {
    this.role = role;
  }

  /**
   * Role-based permission check
   */
  public canPerform(action: ActionType): boolean {
    switch (this.role) {
      case 'host':
        // Host has full control
        return true;

      case 'moderator':
        // Moderator can control playback, change video, and respond to control requests
        return ['play', 'pause', 'seek', 'change_video', 'respond_control', 'chat', 'react', 'request_control'].includes(action);

      case 'participant':
      case 'viewer':
      default:
        // Participants/viewers are read-only for video controls
        return ['chat', 'react', 'request_control'].includes(action);
    }
  }

  /**
   * Check if participant is host
   */
  public isHost(): boolean {
    return this.role === 'host';
  }

  /**
   * Check if participant is moderator
   */
  public isModerator(): boolean {
    return this.role === 'moderator';
  }

  /**
   * Update socket ID on reconnect
   */
  public updateSocketId(newSocketId: string): void {
    this.socketId = newSocketId;
  }

  /**
   * JSON serialization helper
   */
  public toJSON(): ParticipantData {
    return {
      id: this.id,
      socketId: this.socketId,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
    };
  }
}
