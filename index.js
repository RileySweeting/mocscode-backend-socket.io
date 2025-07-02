import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { setupChatSocket } from './chat-socket.js';
import { ALLOWED_ORIGINS, SOCKET_IO_OPTIONS, PORT } from './config.js';

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// --- Socket.IO Setup ---
const io = new Server(server, SOCKET_IO_OPTIONS);
setupChatSocket(io);

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'chat-service',
    socketConnections: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Chat Service running on port ${PORT}`);
});

// --- Graceful Shutdown ---
process.on('SIGTERM', () => {
  console.log('Chat Service shutting down gracefully...');
  io.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});