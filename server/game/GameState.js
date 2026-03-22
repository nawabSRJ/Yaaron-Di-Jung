export class GameState {
  constructor(roomId) {
    this.roomId = roomId;
    this.phase = 'lobby'; // 'lobby' | 'playing' | 'ended'
    this.startedAt = null;
  }
}