import express from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IFlow } from '../core/flow';
import { NodeFactory } from '../factory/node-factory';
import { FlowRunner } from '../core/runner';
import { SQLiteDb } from '../db/sqlite';
import type { Server as SocketIOServer } from 'socket.io';

const router = express.Router();

const activeRunners = new Map<string, FlowRunner>();

let _io: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  _io = io;
}

router.post('/scan', async (req, res) => {
  const { directory } = req.body;
  if (!directory) {
    return res.status(400).json({ error: 'Directory path is required' });
  }

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const videoExts = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'];

    const { randomUUID } = await import('crypto');
    const files = entries
      .filter((entry) => entry.isFile())
      .filter((entry) => {
        const ext = path.extname(entry.name).toLowerCase();
        return videoExts.includes(ext);
      })
      .map((entry) => ({
        id: randomUUID(),
        fileName: entry.name,
        filePath: path.join(directory, entry.name),
        tag: '',
      }));

    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to scan directory: ${err.message}` });
  }
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

  const runner = new FlowRunner(flow, 5);
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
  const { directory, depth } = req.body;
  if (!directory) {
    return res.status(400).json({ error: 'Directory path is required' });
  }

  const searchDepth = typeof depth === 'number' ? depth : 1;

  try {
    const videoExts = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'];
    const { randomUUID } = await import('crypto');

    const found = await scanRecursive(directory, searchDepth, 0, videoExts);
    const files = found.map((f) => ({
      id: randomUUID(),
      fileName: f.fileName,
      filePath: f.filePath,
    }));

    res.json({ success: true, files });
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

  const runner = new FlowRunner(flow, 5);
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
