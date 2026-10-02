import { io, Socket } from 'socket.io-client';
import type { UserRole } from '../types';

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // In local dev with Vite on 5173, target backend on port 5000
    const serverUrl =
      window.location.hostname === 'localhost' && window.location.port === '5173'
        ? 'http://localhost:5000'
        : window.location.origin;

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server with socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected from WebSocket server:', reason);
    });

    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // --- Exact events from Assignment Specification ---

  public joinRoom(roomId: string, username: string, userId: string): void {
    this.getSocket().emit('join_room', { roomId, username, userId });
  }

  public leaveRoom(roomId: string): void {
    this.getSocket().emit('leave_room', { roomId });
  }

  public play(): void {
    this.getSocket().emit('play');
  }

  public pause(): void {
    this.getSocket().emit('pause');
  }

  public seek(time: number): void {
    this.getSocket().emit('seek', { time });
  }

  public changeVideo(videoId: string): void {
    this.getSocket().emit('change_video', { videoId });
  }

  public assignRole(userId: string, role: UserRole): void {
    this.getSocket().emit('assign_role', { userId, role });
  }

  public removeParticipant(userId: string): void {
    this.getSocket().emit('remove_participant', { userId });
  }

  // --- Extended bonus actions ---

  public transferHost(userId: string): void {
    this.getSocket().emit('transfer_host', { userId });
  }

  public sendChatMessage(message: string): void {
    this.getSocket().emit('chat_message', { message });
  }

  public sendReaction(emoji: string): void {
    this.getSocket().emit('send_reaction', { emoji });
  }

  public requestControl(): void {
    this.getSocket().emit('request_control');
  }

  public respondControl(requestId: string, approve: boolean): void {
    this.getSocket().emit('respond_control', { requestId, approve });
  }
}

export const socketService = new SocketService();
