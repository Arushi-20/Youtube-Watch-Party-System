import { Room } from '../models/Room.js';
import { Participant } from '../models/Participant.js';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map();

  private constructor() {
    // Periodic garbage collection for empty rooms older than 10 minutes
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /**
   * Generate clean 6-character room code (e.g. "WATCH1")
   */
  public generateRoomCode(): string {
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
  public createRoom(roomId?: string, roomName?: string, initialVideoId?: string): Room {
    const id = roomId ? roomId.trim().toUpperCase() : this.generateRoomCode();
    if (this.rooms.has(id)) {
      return this.rooms.get(id)!;
    }
    const room = new Room(id, roomName, initialVideoId);
    this.rooms.set(id, room);
    return room;
  }

  /**
   * Get an existing room
   */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.trim().toUpperCase());
  }

  /**
   * Get or create a room
   */
  public getOrCreateRoom(roomId: string, initialVideoId?: string): Room {
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
  public removeRoom(roomId: string): boolean {
    return this.rooms.delete(roomId.trim().toUpperCase());
  }

  /**
   * Find which room and participant a socket belongs to
   */
  public findUserAndRoomBySocketId(socketId: string): { room: Room; participant: Participant } | null {
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
  public cleanupEmptyRooms(): number {
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
  public getStats() {
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
