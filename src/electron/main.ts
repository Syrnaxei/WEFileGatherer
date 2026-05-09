import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import flowsRouter, { setSocketIO } from '../api/flows';
import tagsRouter from '../api/tags';
import settingsRouter from '../api/settings';
import { RecoveryManager } from '../db/recovery';
import { SQLiteDb, ContextStatus } from '../db/sqlite';
import { APP_SHORT_NAME, APP_VERSION } from '../version';

let mainWindow: BrowserWindow | null = null;
let expressServer: ReturnType<typeof createServer> | null = null;

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon.png')
    : path.join(__dirname, '../../../assets/icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: `${APP_SHORT_NAME} v${APP_VERSION}`,
    icon: iconPath,
    show: false, // 等 ready-to-show 再显示，避免白屏
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 开发环境加载 Vite dev server，生产环境加载构建产物
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../../web/dist/index.html'));
  }

  // 页面加载完成后显示窗口并聚焦，确保输入框可以交互
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.webContents.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer() {
  const expressApp = express();
  expressApp.use(express.json());

  const httpServer = createServer(expressApp);
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  expressApp.set('io', io);
  setSocketIO(io);
  expressApp.use('/api', flowsRouter);
  expressApp.use('/api', tagsRouter);
  expressApp.use('/api', settingsRouter);

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
  httpServer.listen(PORT, () => {
    console.log(`[Electron Main] Server running on http://localhost:${PORT}`);
  });

  expressServer = httpServer;
}

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('db:getStats', async (_event, flowId?: string) => {
  const db = SQLiteDb.getInstance();
  return db.getStats(flowId);
});

ipcMain.handle('db:getErrors', async (_event, flowId?: string) => {
  const db = SQLiteDb.getInstance();
  return db.findByStatus(ContextStatus.ERROR);
});

ipcMain.handle('db:discard', async (_event, traceId: string) => {
  const db = SQLiteDb.getInstance();
  db.discard(traceId);
  return { success: true };
});

ipcMain.handle('recovery:check', async () => {
  const manager = new RecoveryManager();
  return manager.checkAndRecover();
});

app.whenReady().then(async () => {
  SQLiteDb.getInstance();
  await startServer();
  const recovery = new RecoveryManager();
  const report = recovery.checkAndRecover();
  if (report.warnings.length > 0) {
    console.warn('[Recovery] Warnings:', report.warnings);
  }
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (expressServer) {
    expressServer.close();
  }
});
