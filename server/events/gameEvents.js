export function registerGameEvents(io, socket, roomManager) {

  // Host starts the game
  socket.on('game:start', (_, callback) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return callback?.({ error: 'Not in a room' });
    if (room.hostSocketId !== socket.id) return callback?.({ error: 'Only host can start' });

    const result = room.startGame();
    if (result.error) return callback?.({ error: result.error });
    callback?.({ success: true });
  });

  // Host resets the room back to lobby after a game ends
  // All players stay in the room with the same code — no need to reshare
  socket.on('game:replay', (_, callback) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return callback?.({ error: 'Not in a room' });
    if (room.hostSocketId !== socket.id) return callback?.({ error: 'Only host can reset' });
    if (room.gameState.phase !== 'ended') return callback?.({ error: 'Game not ended yet' });

    room.resetToLobby();
    // lobby:update is broadcast inside resetToLobby — all clients will receive it
    callback?.({ success: true });
  });

  // Any player voluntarily leaves the room (goes back to menu)
  socket.on('room:leave', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (room) {
      room.handlePlayerDisconnect(socket.id);
      roomManager.playerRoomMap?.delete(socket.id);
      socket.leave(room.roomId);
    }
  });
}