export type UserRole = 'host' | 'moderator' | 'participant' | 'viewer';
export type PlayState = 'playing' | 'paused' | 'buffering' | 'unstarted';

export interface ParticipantData {
  id: string;
  socketId: string;
  username: string;
  role: UserRole;
  joinedAt: number;
}

export interface SyncStatePayload {
  playState: PlayState;
  currentTime: number;
  videoId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  senderName: string;
  xPercent: number; // For randomized floating visual
}

export interface ControlRequestNotification {
  requestId: string;
  userId: string;
  username: string;
  timestamp: number;
}
