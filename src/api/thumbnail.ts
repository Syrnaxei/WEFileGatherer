import express from 'express';
import * as path from 'path';
import { getFfmpegInfo, getPersistedFfmpegInfo, detectFfmpegInDir, clearFfmpegCache, getThumbnailDir, getThumbnailCacheSize, clearThumbnailCache } from '../utils/thumbnail';
import { SQLiteDb } from '../db/sqlite';

const router = express.Router();

router.get('/thumbnail-files/:videoHash/:filename', (req, res) => {
  const { videoHash, filename } = req.params;

  if (!videoHash || !filename) {
    return res.status(400).json({ success: false, error: 'videoHash and filename are required' });
  }

  if (!/^[\da-f]{16}$/.test(videoHash)) {
    return res.status(400).json({ success: false, error: 'Invalid videoHash' });
  }

  if (!/^\d+\.jpg$/.test(filename)) {
    return res.status(400).json({ success: false, error: 'Invalid filename' });
  }

  const filePath = path.join(getThumbnailDir(), videoHash, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`[API] sendFile failed for "${filePath}":`, err.message);
      if (!res.headersSent) {
        res.status(404).json({ success: false, error: 'Thumbnail file not found' });
      }
    }
  });
});

router.get('/ffmpeg/status', async (_req, res) => {
  try {
    let info = getPersistedFfmpegInfo();
    if (info === null) {
      info = await getFfmpegInfo();
    }
    res.json({ success: true, ...info });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ffmpeg/detect', async (req, res) => {
  const { binPath } = req.body;
  console.log(`[API] POST /ffmpeg/detect binPath="${binPath}"`);
  if (!binPath || typeof binPath !== 'string') {
    return res.status(400).json({ success: false, error: 'binPath is required' });
  }

  try {
    const info = await detectFfmpegInDir(binPath);
    console.log(`[API] detect result: available=${info.available} version=${info.version} path=${info.path}`);
    if (info.available) {
      const db = SQLiteDb.getInstance();
      db.setSetting('ffmpegBinPath', binPath);
      clearFfmpegCache();
    } else {
      clearFfmpegCache();
    }
    res.json({ success: true, ...info });
  } catch (err: any) {
    console.error(`[API] detect error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/ffmpeg/cache-size', async (_req, res) => {
  try {
    const size = await getThumbnailCacheSize();
    res.json({ success: true, size });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ffmpeg/clear-cache', async (_req, res) => {
  try {
    const deletedCount = await clearThumbnailCache();
    res.json({ success: true, deletedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
