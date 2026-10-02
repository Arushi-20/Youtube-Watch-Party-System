import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager.js';
import { UserRole } from '../types/index.js';

export class WebSocketHandler {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server) {
    this.io = io;
    this.roomManager = RoomManager.getInstance();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.io.on('connection', (socket: Socket) => {
      // 1. Join Room
      socket.on('join_room', (data: { roomId?: string; username?: string; userId?: string }) => {
        this.handleJoinRoom(socket, data);
      });

      // 2. Leave Room
      socket.on('leave_room', (data: { roomId?: string }) => {
        this.handleLeaveRoom(socket, data);
      });

      // 3. Play
      socket.on('play', (data?: { currentTime?: number }) => {
        this.handlePlay(socket, data);
      });

      // 4. Pause
      socket.on('pause', (data?: { currentTime?: number }) => {
        this.handlePause(socket, data);
      });

      // Periodic Host Sync Pulse for sub-second synchronization
      socket.on('sync_time', (data: { currentTime: number }) => {
        this.handleSyncTime(socket, data);
      });

      // 5. Seek
      socket.on('seek', (data: { time?: number }) => {
        this.handleSeek(socket, data);
      });

      // 6. Change Video
      socket.on('change_video', (data: { videoId?: string }) => {
        this.handleChangeVideo(socket, data);
      });

      // 7. Assign Role
      socket.on('assign_role', (data: { userId?: string; role?: UserRole }) => {
        this.handleAssignRole(socket, data);
      });

      // 8. Remove Participant (Kick)
      socket.on('remove_participant', (data: { userId?: string }) => {
        this.handleRemoveParticipant(socket, data);
      });

      // 9. Transfer Host
      socket.on('transfer_host', (data: { userId?: string }) => {
        this.handleTransferHost(socket, data);
      });

      // 10. Chat Message
      socket.on('chat_message', (data: { message?: string }) => {
        this.handleChatMessage(socket, data);
      });

      // 11. Send Reaction
      socket.on('send_reaction', (data: { emoji?: string }) => {
        this.handleReaction(socket, data);
      });

      // 12. Request Control
      socket.on('request_control', () => {
        this.handleRequestControl(socket);
      });

      // 13. Respond to Control Request
      socket.on('respond_control', (data: { requestId?: string; approve?: boolean }) => {
        this.handleRespondControl(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(
    socket: Socket,
    data: { roomId?: string; username?: string; userId?: string }
  ): void {
    const rawRoomId = data.roomId || this.roomManager.generateRoomCode();
    const roomId = rawRoomId.trim().toUpperCase();
    const username = (data.username && data.username.trim()) || 'Guest';
    const userId = data.userId || socket.id;

    const room = this.roomManager.getOrCreateRoom(roomId);
    const participant = room.addParticipant(userId, socket.id, username);

    socket.join(roomId);

    // Save session info on socket data
    socket.data.roomId = roomId;
    socket.data.userId = participant.id;

    // Send initial full state to joined user
    socket.emit('joined_successfully', {
      roomId,
      userId: participant.id,
      role: participant.role,
      username: participant.username,
      syncState: room.getSyncState(),
      participants: room.getAllParticipants(),
      chatHistory: room.getChatHistory(),
    });

    // Also emit sync_state to client
    socket.emit('sync_state', room.getSyncState());

    // Broadcast user_joined to all clients in room
    this.io.to(roomId).emit('user_joined', {
      username: participant.username,
      userId: participant.id,
      role: participant.role,
      participants: room.getAllParticipants(),
    });
  }

  private handleLeaveRoom(socket: Socket, data: { roomId?: string }): void {
    const roomId = data.roomId || socket.data.roomId;
    if (!roomId) return;

    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    const userId = socket.data.userId;
    if (!userId) return;

    const result = room.removeParticipant(userId);
    socket.leave(roomId);

    if (result) {
      this.io.to(roomId).emit('user_left', {
        username: result.removed.username,
        userId: result.removed.id,
        participants: room.getAllParticipants(),
      });

      if (result.newHost) {
        this.io.to(roomId).emit('role_assigned', {
          userId: result.newHost.id,
          username: result.newHost.username,
          role: result.newHost.role,
          participants: room.getAllParticipants(),
        });
      }
    }
  }

  private handlePlay(socket: Socket, data?: { currentTime?: number }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) {
      socket.emit('error_message', { message: 'Not connected to a room' });
      return;
    }

    const { room, participant } = userAndRoom;
    const result = room.play(participant.id, data?.currentTime);

    if (!result.success) {
      socket.emit('permission_denied', { action: 'play', error: result.error });
      return;
    }

    // Broadcast updated sync_state to all room clients
    this.io.to(room.id).emit('sync_state', room.getSyncState());
  }

  private handlePause(socket: Socket, data?: { currentTime?: number }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) {
      socket.emit('error_message', { message: 'Not connected to a room' });
      return;
    }

    const { room, participant } = userAndRoom;
    const result = room.pause(participant.id, data?.currentTime);

    if (!result.success) {
      socket.emit('permission_denied', { action: 'pause', error: result.error });
      return;
    }

    this.io.to(room.id).emit('sync_state', room.getSyncState());
  }

  private handleSyncTime(socket: Socket, data: { currentTime: number }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom || typeof data?.currentTime !== 'number') return;

    const { room, participant } = userAndRoom;
    if (participant.canPerform('play')) {
      const updated = room.updatePlaybackTime(participant.id, data.currentTime);
      if (updated) {
        // Broadcast sync to other participants in the room
        socket.to(room.id).emit('sync_state', room.getSyncState());
      }
    }
  }

  private handleSeek(socket: Socket, data: { time?: number }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) {
      socket.emit('error_message', { message: 'Not connected to a room' });
      return;
    }

    const time = typeof data.time === 'number' ? data.time : 0;
    const { room, participant } = userAndRoom;
    const result = room.seek(participant.id, time);

    if (!result.success) {
      socket.emit('permission_denied', { action: 'seek', error: result.error });
      return;
    }

    this.io.to(room.id).emit('sync_state', room.getSyncState());
  }

  private handleChangeVideo(socket: Socket, data: { videoId?: string }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) {
      socket.emit('error_message', { message: 'Not connected to a room' });
      return;
    }

    if (!data.videoId) {
      socket.emit('error_message', { message: 'Video ID is required' });
      return;
    }

    const { room, participant } = userAndRoom;
    const result = room.changeVideo(participant.id, data.videoId);

    if (!result.success) {
      socket.emit('permission_denied', { action: 'change_video', error: result.error });
      return;
    }

    this.io.to(room.id).emit('sync_state', room.getSyncState());
  }

  private handleAssignRole(socket: Socket, data: { userId?: string; role?: UserRole }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) {
      socket.emit('error_message', { message: 'Not connected to a room' });
      return;
    }

    if (!data.userId || !data.role) {
      socket.emit('error_message', { message: 'User ID and Role are required' });
      return;
    }

    const { room, participant } = userAndRoom;
    const result = room.assignRole(participant.id, data.userId, data.role);

    if (!result.success) {
      socket.emit('permission_denied', { action: 'assign_role', error: result.error });
      return;
    }

    const targetUser = room.getParticipant(data.userId);
    this.io.to(room.id).emit('role_assigned', {
      userId: data.userId,
      username: targetUser?.username || 'User',
      role: data.role,
      participants: room.getAllParticipants(),
    });
  }

  private handleTransferHost(socket: Socket, data: { userId?: string }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) {
      socket.emit('error_message', { message: 'Not connected to a room' });
      return;
    }

    if (!data.userId) {
      socket.emit('error_message', { message: 'Target user ID is required' });
      return;
    }

    const { room, participant } = userAndRoom;
    const result = room.transferHost(participant.id, data.userId);

    if (!result.success) {
      socket.emit('permission_denied', { action: 'transfer_host', error: result.error });
      return;
    }

    const newHost = room.getParticipant(data.userId);
    this.io.to(room.id).emit('role_assigned', {
      userId: data.userId,
      username: newHost?.username || 'User',
      role: 'host',
      participants: room.getAllParticipants(),
    });
  }

  private handleRemoveParticipant(socket: Socket, data: { userId?: string }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) {
      socket.emit('error_message', { message: 'Not connected to a room' });
      return;
    }

    if (!data.userId) {
      socket.emit('error_message', { message: 'User ID is required' });
      return;
    }

    const { room, participant } = userAndRoom;
    const result = room.kickParticipant(participant.id, data.userId);

    if (!result.success) {
      socket.emit('permission_denied', { action: 'remove_participant', error: result.error });
      return;
    }

    // Direct kick notification to the target user's socket
    if (result.targetSocketId) {
      const targetSocket = this.io.sockets.sockets.get(result.targetSocketId);
      if (targetSocket) {
        targetSocket.emit('kicked', { reason: 'You have been removed from the party by the host.' });
        targetSocket.leave(room.id);
      }
    }

    // Broadcast participant_removed to remaining room members
    this.io.to(room.id).emit('participant_removed', {
      userId: data.userId,
      participants: room.getAllParticipants(),
    });
  }

  private handleChatMessage(socket: Socket, data: { message?: string }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom || !data.message) return;

    const { room, participant } = userAndRoom;
    const msg = room.addChatMessage(participant.id, data.message);

    if (msg) {
      this.io.to(room.id).emit('chat_message', msg);
    }
  }

  private handleReaction(socket: Socket, data: { emoji?: string }): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom || !data.emoji) return;

    const { room, participant } = userAndRoom;
    const reactionPayload = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      emoji: data.emoji,
      senderId: participant.id,
      senderName: participant.username,
      timestamp: Date.now(),
    };

    this.io.to(room.id).emit('reaction', reactionPayload);
  }

  private handleRequestControl(socket: Socket): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) return;

    const { room, participant } = userAndRoom;
    const res = room.requestControl(participant.id);
    if (!res) return;

    // Send notification to Host and Moderators in room
    const host = room.getHost();
    if (host) {
      this.io.to(host.socketId).emit('control_requested', {
        requestId: res.request.id,
        userId: participant.id,
        username: participant.username,
        timestamp: res.request.requestedAt,
      });
    }

    // Acknowledge requester
    socket.emit('control_request_sent', { message: 'Control request submitted to host' });
  }

  private handleRespondControl(
    socket: Socket,
    data: { requestId?: string; approve?: boolean }
  ): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom || !data.requestId) return;

    const { room, participant } = userAndRoom;
    const res = room.respondToControlRequest(participant.id, data.requestId, !!data.approve);

    if (res.success && res.targetUser && data.approve) {
      this.io.to(room.id).emit('role_assigned', {
        userId: res.targetUser.id,
        username: res.targetUser.username,
        role: res.targetUser.role,
        participants: room.getAllParticipants(),
      });
    }
  }

  private handleDisconnect(socket: Socket): void {
    const userAndRoom = this.roomManager.findUserAndRoomBySocketId(socket.id);
    if (!userAndRoom) return;

    const { room, participant } = userAndRoom;
    const result = room.removeParticipant(participant.id);

    if (result) {
      this.io.to(room.id).emit('user_left', {
        username: result.removed.username,
        userId: result.removed.id,
        participants: room.getAllParticipants(),
      });

      if (result.newHost) {
        this.io.to(room.id).emit('role_assigned', {
          userId: result.newHost.id,
          username: result.newHost.username,
          role: result.newHost.role,
          participants: room.getAllParticipants(),
        });
      }
    }
  }
}
