import { GameRoom } from './GameRoom.js';

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.playerRoomMap = new Map();
  }

  createRoom(hostSocketId, hostName) {
    const roomId = this._generateRoomId();
    const room = new GameRoom(this.io, roomId, hostSocketId, hostName);
    this.rooms.set(roomId, room);
    this.playerRoomMap.set(hostSocketId, roomId);
    console.log(`[RoomManager] Room created: ${roomId} by ${hostName}`);
    return room;
  }

  joinRoom(roomId, socketId, playerName) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.gameState.phase !== 'lobby') return { error: 'Game already started' };
    if (room.getPlayerCount() >= 7) return { error: 'Room is full (max 7 players)' };
    const result = room.addPlayer(socketId, playerName);
    if (!result.error) this.playerRoomMap.set(socketId, roomId);
    return result;
  }

  getRoomByPlayer(socketId) {
    const roomId = this.playerRoomMap.get(socketId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  getRoomById(roomId) {
    return this.rooms.get(roomId);
  }

  handleDisconnect(socketId) {
    const room = this.getRoomByPlayer(socketId);
    if (room) {
      room.handlePlayerDisconnect(socketId);
      this.playerRoomMap.delete(socketId);
      if (room.getPlayerCount() === 0) {
        room.cleanup();
        this.rooms.delete(room.roomId);
        console.log(`[RoomManager] Room ${room.roomId} deleted (empty)`);
      }
    }
  }

  _generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return this.rooms.has(id) ? this._generateRoomId() : id;
  }
}