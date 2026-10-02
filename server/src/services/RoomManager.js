import { Room } from '../models/Room.js';

export class RoomManager {
  static instance = null;

  constructor() {
    this.rooms = new Map();
    // Periodic garbage collection for empty rooms older than 15 minutes
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, 5 * 60 * 1000);
  }

  static getInstance() {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /**
   * Generate clean 6-character room code (e.g. "WATCH1")
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Create a new room
   */
  createRoom(roomId, roomName, initialVideoId) {
    const id = roomId ? roomId.trim().toUpperCase() : this.generateRoomCode();
    if (this.rooms.has(id)) {
      return this.rooms.get(id);
    }
    const room = new Room(id, roomName, initialVideoId);
    this.rooms.set(id, room);
    return room;
  }

  /**
   * Get an existing room
   */
  getRoom(roomId) {
    return this.rooms.get(roomId.trim().toUpperCase());
  }

  /**
   * Get or create a room
   */
  getOrCreateRoom(roomId, initialVideoId) {
    const id = roomId.trim().toUpperCase();
    let room = this.rooms.get(id);
    if (!room) {
      room = new Room(id, `Party ${id}`, initialVideoId);
      this.rooms.set(id, room);
    }
    return room;
  }

  /**
   * Delete room
   */
  removeRoom(roomId) {
    return this.rooms.delete(roomId.trim().toUpperCase());
  }

  /**
   * Find which room and participant a socket belongs to
   */
  findUserAndRoomBySocketId(socketId) {
    for (const room of this.rooms.values()) {
      const participant = room.getParticipantBySocketId(socketId);
      if (participant) {
        return { room, participant };
      }
    }
    return null;
  }

  /**
   * Clean up empty rooms
   */
  cleanupEmptyRooms() {
    let count = 0;
    const now = Date.now();
    for (const [id, room] of this.rooms.entries()) {
      if (room.isEmpty() && now - room.createdAt > 15 * 60 * 1000) {
        this.rooms.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get system statistics
   */
  getStats() {
    let totalUsers = 0;
    for (const room of this.rooms.values()) {
      totalUsers += room.getAllParticipants().length;
    }
    return {
      activeRooms: this.rooms.size,
      activeUsers: totalUsers,
    };
  }
}
