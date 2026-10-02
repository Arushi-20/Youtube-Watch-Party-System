import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
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

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // --- Exact events from Assignment Specification ---

  joinRoom(roomId, username, userId) {
    this.getSocket().emit('join_room', { roomId, username, userId });
  }

  leaveRoom(roomId) {
    this.getSocket().emit('leave_room', { roomId });
  }

  play(currentTime) {
    this.getSocket().emit('play', typeof currentTime === 'number' ? { currentTime } : {});
  }

  pause(currentTime) {
    this.getSocket().emit('pause', typeof currentTime === 'number' ? { currentTime } : {});
  }

  syncTime(currentTime) {
    this.getSocket().emit('sync_time', { currentTime });
  }

  seek(time) {
    this.getSocket().emit('seek', { time });
  }

  changeVideo(videoId) {
    this.getSocket().emit('change_video', { videoId });
  }

  assignRole(userId, role) {
    this.getSocket().emit('assign_role', { userId, role });
  }

  removeParticipant(userId) {
    this.getSocket().emit('remove_participant', { userId });
  }

  // --- Extended actions ---

  transferHost(userId) {
    this.getSocket().emit('transfer_host', { userId });
  }

  sendChatMessage(message) {
    this.getSocket().emit('chat_message', { message });
  }

  sendReaction(emoji) {
    this.getSocket().emit('send_reaction', { emoji });
  }

  requestControl() {
    this.getSocket().emit('request_control');
  }

  respondControl(requestId, approve) {
    this.getSocket().emit('respond_control', { requestId, approve });
  }
}

export const socketService = new SocketService();
