export type UserRole = 'host' | 'moderator' | 'participant' | 'viewer';

export type PlayState = 'playing' | 'paused' | 'buffering' | 'unstarted';

export interface ParticipantData {
  id: string;
  socketId: string;
  username: string;
  role: UserRole;
  joinedAt: number;
}

export interface VideoState {
  videoId: string;
  playState: PlayState;
  currentTime: number;
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
}

export interface ControlRequest {
  id: string;
  userId: string;
  username: string;
  requestedAt: number;
}

export interface SyncStatePayload {
  playState: PlayState;
  currentTime: number;
  videoId: string;
}

export interface UserJoinedPayload {
  username: string;
  userId: string;
  role: UserRole;
  participants: ParticipantData[];
}

export interface UserLeftPayload {
  username: string;
  userId: string;
  participants: ParticipantData[];
}

export interface RoleAssignedPayload {
  userId: string;
  username: string;
  role: UserRole;
  participants: ParticipantData[];
}

export interface ParticipantRemovedPayload {
  userId: string;
  participants: ParticipantData[];
}

export interface EmojiReactionPayload {
  id: string;
  emoji: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}
