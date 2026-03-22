import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager.js';
import { registerPlayerEvents } from './events/playerEvents.js';
import { registerGameEvents } from './events/gameEvents.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager(io);

// Health check
app.get('/', (_, res) => res.json({ status: 'Yaaron Di Jung Server Running 🎮' }));

io.on('connection', (socket) => {
  console.log(`[Server] Player connected: ${socket.id}`);

  registerPlayerEvents(io, socket, roomManager);
  registerGameEvents(io, socket, roomManager);

  socket.on('disconnect', () => {
    console.log(`[Server] Player disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎮 Yaaron Di Jung Server listening on port ${PORT}\n`);
});