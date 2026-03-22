export function registerPlayerEvents(io, socket, roomManager) {
  socket.on('room:create', ({ playerName }, callback) => {
    const room = roomManager.createRoom(socket.id, playerName);
    socket.join(room.roomId);
    callback({ success: true, roomId: room.roomId, lobby: room.getLobbyData() });
  });

  socket.on('room:join', ({ roomId, playerName }, callback) => {
    const result = roomManager.joinRoom(roomId.toUpperCase(), socket.id, playerName);
    if (result.error) return callback({ error: result.error });
    socket.join(roomId.toUpperCase());
    const room = roomManager.getRoomById(roomId.toUpperCase());
    callback({ success: true, roomId: roomId.toUpperCase(), lobby: room.getLobbyData() });
  });

  socket.on('player:input', (input) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (room) room.handlePlayerInput(socket.id, input);
  });

  socket.on('player:attack', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (room) room.handleAttack(socket.id);
  });
}