import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { RoomManager } from './services/RoomManager.js';
import { WebSocketHandler } from './controllers/WebSocketHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || '*';

// Configure Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Middleware
app.use(cors());
app.use(express.json());

const roomManager = RoomManager.getInstance();
const wsHandler = new WebSocketHandler(io);

// API Endpoints
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: roomManager.getStats(),
  });
});

app.get('/api/rooms/:id', (req, res) => {
  const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const roomId = (paramId || '').toUpperCase();
  const room = roomManager.getRoom(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  res.json({
    roomId: room.id,
    name: room.name,
    participantCount: room.getAllParticipants().length,
    syncState: room.getSyncState(),
  });
});

// Serve frontend static build in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.use((_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('YouTube Watch Party Backend is running! Run the Vite frontend or build it.');
  });
}

// Start HTTP + WebSocket Server
httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Watch Party Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🌍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

// Handle graceful termination
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});
