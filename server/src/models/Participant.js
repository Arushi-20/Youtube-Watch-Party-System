export class Participant {
  constructor(id, socketId, username, role = 'participant') {
    this.id = id;
    this.socketId = socketId;
    this.username = (username && username.trim()) || 'Anonymous';
    this.role = role;
    this.joinedAt = Date.now();
  }

  /**
   * Set user role (Host only can assign)
   */
  setRole(role) {
    this.role = role;
  }

  /**
   * Role-based permission check
   */
  canPerform(action) {
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
  isHost() {
    return this.role === 'host';
  }

  /**
   * Check if participant is moderator
   */
  isModerator() {
    return this.role === 'moderator';
  }

  /**
   * Update socket ID on reconnect
   */
  updateSocketId(newSocketId) {
    this.socketId = newSocketId;
  }

  /**
   * JSON serialization helper
   */
  toJSON() {
    return {
      id: this.id,
      socketId: this.socketId,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
    };
  }
}
