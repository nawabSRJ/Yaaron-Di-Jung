import { io } from 'socket.io-client';

// const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://100.112.239.37:3001';
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket] Disconnected:', reason);
});

export default socket;