export function registerGameEvents(io, socket, roomManager) {
  socket.on('game:start', (_, callback) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return callback?.({ error: 'Not in a room' });
    if (room.hostSocketId !== socket.id) return callback?.({ error: 'Only host can start' });
    const result = room.startGame();
    if (result.error) return callback?.({ error: result.error });
    callback?.({ success: true });
  });
}