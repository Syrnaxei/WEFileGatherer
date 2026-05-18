import express from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IFlow } from '../core/flow';
import { NodeFactory } from '../factory/node-factory';
import { FlowRunner } from '../core/runner';
import { SQLiteDb } from '../db/sqlite';
import { findFfprobe, generateThumbnailsForVideo, getFfmpegInfo, computeVideoHash, getQualityDimensions } from '../utils/thumbnail';
import { probeVideoFile, resolveFfprobeCmd } from '../utils/probe';
import type { Server as SocketIOServer } from 'socket.io';

const router = express.Router();

const activeRunners = new Map<string, FlowRunner>();

const probeCache = new Map<string, { fileSize: number; duration: number; bitrate: number }>();

let _io: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  _io = io;
}

function emitThumbnailReady(fileId: string, urls: string[]) {
  if (_io) {
    _io.emit('thumbnail:ready', { fileId, urls });
    console.log(`[Socket] thumbnail:ready fileId=${fileId} urls=${urls.length}`);
  }
}

function emitProbeReady(filePath: string, result: { fileSize: number; duration: number; bitrate: number }) {
  if (_io) {
    _io.emit('probe:ready', { filePath, ...result });
  }
}

async function startThumbnailGeneration(files: { filePath: string; fileName: string; duration: number }[], logPrefix: string) {
  if (!files || files.length === 0) {
    console.log(`[${logPrefix}] No files to generate thumbnails for, skipping`);
    return;
  }

  const db = SQLiteDb.getInstance();
  const ffmpegInfo = await getFfmpegInfo();
  if (!ffmpegInfo.available) {
    console.warn(`[${logPrefix}] ffmpeg not available, skipping thumbnail generation`);
    return;
  }
  const thumbnailCount = parseInt(db.getSetting('thumbnailCount') || '3', 10) || 3;
  const thumbnailQuality = db.getSetting('thumbnailQuality') || 'medium';
  const qualityDims = getQualityDimensions(thumbnailQuality);
  console.log(`[${logPrefix}] Starting thumbnail generation for ${files.length} videos (count=${thumbnailCount}, quality=${thumbnailQuality}, ${qualityDims.width}x${qualityDims.height})`);

  for (const file of files) {
    generateThumbnailsForVideo(file.filePath, '', thumbnailCount, { quality: thumbnailQuality, duration: file.duration, width: qualityDims.width, height: qualityDims.height })
      .then((result) => {
        if (result.urls.length > 0) {
          emitThumbnailReady(file.filePath, result.urls);
        } else if (result.error) {
          console.warn(`[${logPrefix}] thumbnail failed for ${file.fileName}: ${result.error}`);
        }
      })
      .catch((err) => {
        console.error(`[${logPrefix}] thumbnail error for ${file.fileName}:`, err);
      });
  }
}

async function startAsyncProbe(files: { id: string; filePath: string; fileName: string }[], ffprobeCmd: string | null, logPrefix: string): Promise<{ fileSize: number; duration: number; bitrate: number }[]> {
  if (!files || files.length === 0) return [];

  console.log(`[${logPrefix}] Starting async probe for ${files.length} files`);

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const result = await probeVideoFile(file.filePath, ffprobeCmd);
        probeCache.set(file.id, result);
        emitProbeReady(file.id, result);
        return result;
      } catch (err) {
        console.error(`[${logPrefix}] probe error for ${file.fileName}:`, err);
        const fallback = { fileSize: 0, duration: 0, bitrate: 0 };
        probeCache.set(file.id, fallback);
        emitProbeReady(file.id, fallback);
        return fallback;
      }
    })
  );
  return results;
}

function resolveConcurrency(): number {
  const db = SQLiteDb.getInstance();
  const mode = db.getSetting('processingMode') || 'parallel';
  if (mode === 'fifo') {
    return 1;
  }
  const raw = parseInt(db.getSetting('concurrency') || '5', 10);
  if (isNaN(raw) || raw < 1) return 1;
  if (raw > 5) return 5;
  return raw;
}

router.post('/scan', async (req, res) => {
  const { directory, viewMode: clientViewMode, existingHashes } = req.body;
  if (!directory) {
    return res.status(400).json({ error: 'Directory path is required' });
  }

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const videoExts = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'];

    const { randomUUID } = await import('crypto');

    const videoEntries = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => {
        const ext = path.extname(entry.name).toLowerCase();
        return videoExts.includes(ext);
      });

    const existingHashSet = new Set<string>(
      Array.isArray(existingHashes) ? existingHashes.filter((h: any) => typeof h === 'string') : []
    );

    const allFiles = videoEntries.map((entry) => {
      const filePath = path.join(directory, entry.name);
      return {
        id: randomUUID(),
        fileName: entry.name,
        filePath,
        tag: '',
        fileSize: 0,
        duration: 0,
        bitrate: 0,
        videoHash: computeVideoHash(filePath),
      };
    });

    const files = existingHashSet.size > 0
      ? allFiles.filter((f) => !existingHashSet.has(f.videoHash))
      : allFiles;

    const skippedCount = allFiles.length - files.length;
    if (skippedCount > 0) {
      console.log(`[Scan] Skipped ${skippedCount} duplicate file(s) based on videoHash`);
    }

    res.json({ success: true, files, skippedCount });

    if (files.length === 0) {
      console.log('[Scan] No new video files found, skipping probe and thumbnail generation');
      return;
    }

    const db = SQLiteDb.getInstance();
    const ffprobeCmd = await resolveFfprobeCmd(db.getSetting('ffmpegBinPath') || undefined);

    const probePromise = startAsyncProbe(files, ffprobeCmd, 'Scan');

    const viewMode = clientViewMode || db.getSetting('fileListViewMode') || 'thumbnail';
    if (viewMode !== 'list') {
      probePromise.then((probeResults) => {
        const filesWithDuration = files.map((f, i) => ({
          filePath: f.filePath,
          fileName: f.fileName,
          duration: probeResults[i]?.duration ?? 0,
        }));
        startThumbnailGeneration(filesWithDuration, 'Scan');
      });
    } else {
      console.log('[Scan] List view mode, skipping thumbnail generation');
    }
  } catch (err: any) {
    res.status(500).json({ error: `Failed to scan directory: ${err.message}` });
  }
});

router.get('/probe-results', async (req, res) => {
  const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').filter(Boolean) : [];
  if (ids.length === 0) {
    return res.json({ success: true, results: {} });
  }

  const results: Record<string, { fileSize: number; duration: number; bitrate: number }> = {};
  for (const id of ids) {
    const cached = probeCache.get(id);
    if (cached) {
      results[id] = cached;
    }
  }

  res.json({ success: true, results });
});

router.get('/flows', async (_req, res) => {
  res.json([]);
});

router.post('/flows', async (req, res) => {
  const flow: IFlow = req.body;
  res.json({ success: true, flow });
});

router.post('/flows/:id/start', async (req, res) => {
  const flowId = req.params.id;
  const { files } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Files array is required' });
  }

  const filesToProcess = files.filter((f: any) => (f.tag ?? '').trim() !== '');
  if (filesToProcess.length === 0) {
    return res.status(400).json({ error: 'No files with tags provided' });
  }

  const db = SQLiteDb.getInstance();

  const tagPathMap: Record<string, string> = {};
  for (const file of filesToProcess) {
    const tagName = (file.tag ?? '').trim();
    if (!tagPathMap[tagName]) {
      const tagRecord = db.getTagByName(tagName);
      if (tagRecord) {
        tagPathMap[tagName] = tagRecord.target_path;
      }
    }
  }

  const missingTags = [...new Set(filesToProcess.map((f: any) => (f.tag ?? '').trim()))]
    .filter((tagName: string) => !tagPathMap[tagName]);

  if (missingTags.length > 0) {
    return res.status(400).json({
      error: `以下 tag 未找到对应的目标路径配置: ${missingTags.join(', ')}，请先在 Tag 管理中创建`,
    });
  }

  const flow: IFlow = {
    id: flowId,
    name: 'Batch Processing',
    nodes: [
      NodeFactory.create({
        id: 'node-tagger',
        type: 'tagger',
        config: {
          rules: [{ type: 'user_tag', params: {} }],
        },
      }),
      NodeFactory.create({
        id: 'node-mover',
        type: 'mover',
        config: {
          targetPathTemplate: '{metadata.targetPath}/{filename}',
          overwrite: false,
        },
      }),
    ],
    edges: [
      { sourceId: 'node-tagger', targetId: 'node-mover' },
    ],
  };

  if (activeRunners.has(flowId)) {
    activeRunners.delete(flowId);
  }

  db.ensureFlow(flowId, flow.name);

  const runner = new FlowRunner(flow, resolveConcurrency());
  activeRunners.set(flowId, runner);

  const io = _io;

  runner.on('log', (payload) => {
    if (io) {
      io.to(`flow:${flowId}`).emit('log', payload);
    }
  });

  for (const file of filesToProcess) {
      const tagName = file.tag.trim();
      const targetPath = tagPathMap[tagName];

      const ctx = {
        traceId: file.id || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        originalFileName: file.fileName,
        originalPath: file.filePath,
        currentPath: file.filePath,
        tags: [],
        metadata: {
          userTag: tagName,
          targetPath,
          detectedAt: new Date().toISOString(),
        },
      };
      runner.enqueue(ctx).catch((err) => {
        console.error(`[Flow] Failed to process file ${file.fileName}:`, err);
      });
    }

  res.json({ success: true, message: `Started processing ${filesToProcess.length} files` });
});

router.post('/flows/:id/stop', async (req, res) => {
  const flowId = req.params.id;
  const runner = activeRunners.get(flowId);
  if (!runner) {
    return res.status(404).json({ error: 'Flow not running' });
  }

  activeRunners.delete(flowId);
  res.json({ success: true, message: `Flow ${flowId} stopped` });
});

async function scanRecursive(
  dir: string,
  depth: number,
  currentDepth: number,
  videoExts: string[],
): Promise<{ fileName: string; filePath: string }[]> {
  if (currentDepth > depth) return [];

  const results: { fileName: string; filePath: string }[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (videoExts.includes(ext)) {
        results.push({ fileName: entry.name, filePath: fullPath });
      }
    } else if (entry.isDirectory() && currentDepth < depth) {
      const subResults = await scanRecursive(fullPath, depth, currentDepth + 1, videoExts);
      results.push(...subResults);
    }
  }

  return results;
}

router.post('/scrape/scan', async (req, res) => {
  const { directory, depth, existingHashes } = req.body;
  if (!directory) {
    return res.status(400).json({ error: 'Directory path is required' });
  }

  const searchDepth = typeof depth === 'number' ? depth : 1;

  try {
    const videoExts = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'];
    const { randomUUID } = await import('crypto');

    const found = await scanRecursive(directory, searchDepth, 0, videoExts);

    const existingHashSet = new Set<string>(
      Array.isArray(existingHashes) ? existingHashes.filter((h: any) => typeof h === 'string') : []
    );

    const allFiles = found.map((f) => {
      return {
        id: randomUUID(),
        fileName: f.fileName,
        filePath: f.filePath,
        fileSize: 0,
        duration: 0,
        bitrate: 0,
        videoHash: computeVideoHash(f.filePath),
      };
    });

    const files = existingHashSet.size > 0
      ? allFiles.filter((f) => !existingHashSet.has(f.videoHash))
      : allFiles;

    const skippedCount = allFiles.length - files.length;
    if (skippedCount > 0) {
      console.log(`[ScrapeScan] Skipped ${skippedCount} duplicate file(s) based on videoHash`);
    }

    res.json({ success: true, files, skippedCount });

    if (files.length === 0) {
      console.log('[ScrapeScan] No new video files found, skipping probe and thumbnail generation');
      return;
    }

    const db = SQLiteDb.getInstance();
    const ffprobeCmd = await resolveFfprobeCmd(db.getSetting('ffmpegBinPath') || undefined);

    startAsyncProbe(files, ffprobeCmd, 'ScrapeScan').then((probeResults) => {
    const filesWithDuration = files.map((f, i) => ({
      filePath: f.filePath,
      fileName: f.fileName,
      duration: probeResults[i]?.duration ?? 0,
    }));
    startThumbnailGeneration(filesWithDuration, 'ScrapeScan');
  });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to scan directory: ${err.message}` });
  }
});

router.post('/scrape/start', async (req, res) => {
  const { files, exportDir } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Files array is required' });
  }
  if (!exportDir) {
    return res.status(400).json({ error: 'Export directory is required' });
  }

  const flowId = 'scrape-flow';
  const flow: IFlow = {
    id: flowId,
    name: 'Scrape Processing',
    nodes: [
      NodeFactory.create({
        id: 'node-mover',
        type: 'mover',
        config: {
          targetPathTemplate: '{metadata.exportDir}/{filename}',
          overwrite: false,
        },
      }),
    ],
    edges: [],
  };

  if (activeRunners.has(flowId)) {
    activeRunners.delete(flowId);
  }

  const db = SQLiteDb.getInstance();
  db.ensureFlow(flowId, flow.name);

  const runner = new FlowRunner(flow, resolveConcurrency());
  activeRunners.set(flowId, runner);

  const io = _io;

  runner.on('log', (payload) => {
    if (io) {
      io.to(`flow:${flowId}`).emit('log', payload);
    }
  });

  for (const file of files) {
    const ctx = {
      traceId: file.id || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      originalFileName: file.fileName,
      originalPath: file.filePath,
      currentPath: file.filePath,
      tags: [],
      metadata: {
        exportDir,
        detectedAt: new Date().toISOString(),
      },
    };
    runner.enqueue(ctx).catch((err) => {
      console.error(`[Scrape] Failed to process file ${file.fileName}:`, err);
    });
  }

  res.json({ success: true, message: `Started processing ${files.length} files` });
});

router.post('/scrape/stop', async (_req, res) => {
  const flowId = 'scrape-flow';
  const runner = activeRunners.get(flowId);
  if (!runner) {
    return res.status(404).json({ error: 'Scrape flow not running' });
  }

  activeRunners.delete(flowId);
  res.json({ success: true, message: 'Scrape flow stopped' });
});

export default router;
