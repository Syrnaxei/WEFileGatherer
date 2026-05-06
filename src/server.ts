import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import flowsRouter, { setSocketIO } from './api/flows';
import tagsRouter from './api/tags';
import settingsRouter from './api/settings';
import { SQLiteDb } from './db/sqlite';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web/dist')));

app.set('io', io);
setSocketIO(io);

app.use('/api', flowsRouter);
app.use('/api', tagsRouter);
app.use('/api', settingsRouter);

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('subscribe', (flowId: string) => {
    socket.join(`flow:${flowId}`);
    console.log(`[Socket] ${socket.id} subscribed to flow:${flowId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

async function main() {
  SQLiteDb.getInstance();
  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

main();
