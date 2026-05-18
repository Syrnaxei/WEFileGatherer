import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 360;
const DEFAULT_JPEG_QUALITY = 5;

const QUALITY_MAP: Record<string, { qv: number; width: number; height: number }> = {
  low: { qv: 12, width: 480, height: 270 },
  medium: { qv: 6, width: 640, height: 360 },
  high: { qv: 3, width: 960, height: 540 },
};

export function getJpegQuality(quality?: string): number {
  if (quality && QUALITY_MAP[quality] !== undefined) {
    return QUALITY_MAP[quality].qv;
  }
  return DEFAULT_JPEG_QUALITY;
}

export function getQualityDimensions(quality?: string): { width: number; height: number } {
  if (quality && QUALITY_MAP[quality] !== undefined) {
    return { width: QUALITY_MAP[quality].width, height: QUALITY_MAP[quality].height };
  }
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

export function getThumbnailDir(): string {
  try {
    const electronApp = require('electron').app;
    return path.join(electronApp.getPath('temp'), 'SVFPcache');
  } catch {
    const localAppData = process.env.LOCALAPPDATA || process.env.TEMP || process.env.TMP || '';
    if (localAppData) {
      return path.join(localAppData, 'Temp', 'SVFPcache');
    }
    return path.resolve('data/thumbnails');
  }
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export function computeVideoHash(filePath: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(filePath);
  return hash.digest('hex').slice(0, 16);
}

async function tryExecVersion(cmd: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(cmd, ['-version'], { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) {
        console.log(`[ffmpeg] execFile failed for "${cmd}": code=${err.code}, message=${err.message}`);
        resolve(null);
        return;
      }
      const output = (stdout || '') + (stderr || '');
      if (output.length > 0) {
        resolve(output);
      } else {
        resolve(null);
      }
    });
  });
}

async function findBinary(names: string[], binDir?: string): Promise<{ cmd: string; path: string } | null> {
  const candidates: string[] = [];

  if (binDir) {
    let dir = binDir;
    try {
      const stat = await fs.stat(binDir);
      if (stat.isFile()) {
        dir = path.dirname(binDir);
        console.log(`[ffmpeg] binPath is a file, using directory: ${dir}`);
      }
    } catch {
      console.log(`[ffmpeg] binPath does not exist: ${binDir}`);
    }

    for (const name of names) {
      candidates.push(path.join(dir, name));
    }
  }

  for (const name of names) {
    candidates.push(name);
  }

  for (const cmd of candidates) {
    console.log(`[ffmpeg] trying: ${cmd}`);
    const output = await tryExecVersion(cmd);
    if (output) {
      let resolvedPath = cmd;
      if (!path.isAbsolute(cmd)) {
        try {
          const whereResult = await new Promise<string>((resolve, reject) => {
            execFile('where', [cmd], { timeout: 5000 }, (err, stdout) => {
              err ? reject(err) : resolve(stdout);
            });
          });
          const lines = whereResult.trim().split(/\r?\n/);
          resolvedPath = lines[0] || cmd;
        } catch {}
      }
      console.log(`[ffmpeg] found: ${cmd} at ${resolvedPath}`);
      return { cmd, path: resolvedPath };
    }
  }

  console.log(`[ffmpeg] no binary found among: ${names.join(', ')} (binDir=${binDir || 'none'})`);
  return null;
}

let cachedFfmpegCmd: string | null = null;
let cachedFfprobeCmd: string | null = null;

async function findFfmpeg(binDir?: string): Promise<string | null> {
  if (cachedFfmpegCmd) return cachedFfmpegCmd;
  const result = await findBinary(['ffmpeg', 'ffmpeg.exe'], binDir);
  if (result) {
    cachedFfmpegCmd = result.cmd;
  }
  return result ? result.cmd : null;
}

async function findFfprobe(binDir?: string): Promise<string | null> {
  if (cachedFfprobeCmd) return cachedFfprobeCmd;
  const result = await findBinary(['ffprobe', 'ffprobe.exe'], binDir);
  if (result) {
    cachedFfprobeCmd = result.cmd;
  }
  return result ? result.cmd : null;
}

export interface FfmpegInfo {
  available: boolean;
  version?: string;
  path?: string;
}

let cachedFfmpegInfo: FfmpegInfo | null = null;

function getDb(): InstanceType<typeof import('../db/sqlite').SQLiteDb> | null {
  try {
    const { SQLiteDb } = require('../db/sqlite');
    return SQLiteDb.getInstance();
  } catch {
    return null;
  }
}

function getPersistedBinPath(): string | null {
  const db = getDb();
  if (!db) return null;
  const value = db.getSetting('ffmpegBinPath');
  return value || null;
}

function persistFfmpegInfo(info: FfmpegInfo): void {
  const db = getDb();
  if (!db) return;
  db.setSetting('ffmpegAvailable', info.available ? 'true' : 'false');
  if (info.version) db.setSetting('ffmpegVersion', info.version);
  else db.setSetting('ffmpegVersion', '');
  if (info.path) db.setSetting('ffmpegPath', info.path);
  else db.setSetting('ffmpegPath', '');
}

export function getPersistedFfmpegInfo(): FfmpegInfo | null {
  const db = getDb();
  if (!db) return null;
  const stored = db.getSetting('ffmpegAvailable');
  if (stored === undefined) return null;
  const available = stored === 'true';
  if (!available) return { available: false };
  return {
    available: true,
    version: db.getSetting('ffmpegVersion') || undefined,
    path: db.getSetting('ffmpegPath') || undefined,
  };
}

function parseVersion(output: string): string {
  const firstLine = output.split('\n')[0] || '';
  const versionMatch = firstLine.match(/version\s+(\S+)/i);
  return versionMatch ? versionMatch[1] : firstLine.trim();
}

export async function getFfmpegInfo(): Promise<FfmpegInfo> {
  if (cachedFfmpegInfo) return cachedFfmpegInfo;

  const binDir = getPersistedBinPath() || undefined;
  const result = await findBinary(['ffmpeg', 'ffmpeg.exe'], binDir);
  if (!result) {
    cachedFfmpegInfo = { available: false };
    persistFfmpegInfo(cachedFfmpegInfo);
    return cachedFfmpegInfo;
  }

  const output = await tryExecVersion(result.cmd);
  const version = output ? parseVersion(output) : undefined;

  cachedFfmpegInfo = { available: true, version, path: result.path };
  cachedFfmpegCmd = result.cmd;
  persistFfmpegInfo(cachedFfmpegInfo);
  return cachedFfmpegInfo;
}

export async function detectFfmpegInDir(binPath: string): Promise<FfmpegInfo> {
  console.log(`[ffmpeg] detectFfmpegInDir called with: ${binPath}`);
  const result = await findBinary(['ffmpeg', 'ffmpeg.exe'], binPath);
  if (!result) {
    console.log(`[ffmpeg] detectFfmpegInDir: not found`);
    const info: FfmpegInfo = { available: false };
    persistFfmpegInfo(info);
    cachedFfmpegCmd = null;
    return info;
  }

  const output = await tryExecVersion(result.cmd);
  const version = output ? parseVersion(output) : undefined;

  console.log(`[ffmpeg] detectFfmpegInDir: found version=${version} path=${result.path}`);
  const info: FfmpegInfo = { available: true, version, path: result.path };
  persistFfmpegInfo(info);
  cachedFfmpegCmd = result.cmd;
  return info;
}

export function clearFfmpegCache(): void {
  cachedFfmpegInfo = null;
  cachedFfmpegCmd = null;
  cachedFfprobeCmd = null;
}

export interface GenerateThumbnailsResult {
  videoHash: string;
  urls: string[];
  error?: string;
}

export async function generateThumbnailsForVideo(
  videoPath: string,
  fileId: string,
  count: number = 1,
  options?: { width?: number; height?: number; quality?: string; duration?: number }
): Promise<GenerateThumbnailsResult> {
  const width = options?.width ?? DEFAULT_WIDTH;
  const height = options?.height ?? DEFAULT_HEIGHT;
  const jpegQuality = getJpegQuality(options?.quality);
  const duration = options?.duration ?? 0;

  try {
    await fs.access(videoPath);
  } catch {
    return { videoHash: '', urls: [], error: 'Video file not found' };
  }

  const videoHash = computeVideoHash(videoPath);
  const thumbDir = path.join(getThumbnailDir(), videoHash);

  const cachedUrls: string[] = [];
  let allCached = true;
  for (let i = 1; i <= count; i++) {
    const cachedPath = path.join(thumbDir, `${i}.jpg`);
    const exists = await fs.access(cachedPath).then(() => true).catch(() => false);
    if (exists) {
      cachedUrls.push(`/api/thumbnail-files/${videoHash}/${i}.jpg`);
    } else {
      allCached = false;
      break;
    }
  }
  if (allCached) {
    console.log(`[thumbnail] all ${count} cached, skip generation for ${path.basename(videoPath)}`);
    return { videoHash, urls: cachedUrls };
  }

  await ensureDir(thumbDir);

  const binDir = getPersistedBinPath() || undefined;
  const ffmpeg = await findFfmpeg(binDir);
  if (!ffmpeg) {
    console.error(`[thumbnail] ffmpeg not found for ${videoPath}`);
    return { videoHash, urls: [], error: 'ffmpeg not found' };
  }

  const urls: string[] = [];

  for (let i = 1; i <= count; i++) {
    const outputPath = path.join(thumbDir, `${i}.jpg`);

    let seekSeconds: number;
    if (duration > 0 && count >= 2) {
      seekSeconds = 1 + ((i - 1) * (duration - 2)) / (count - 1);
    } else if (duration > 0) {
      seekSeconds = duration / 2;
    } else {
      seekSeconds = i;
    }
    seekSeconds = Math.max(1, Math.floor(seekSeconds));

    const exists = await fs.access(outputPath).then(() => true).catch(() => false);
    if (exists) {
      console.log(`[thumbnail] cache hit: ${outputPath}`);
      urls.push(`/api/thumbnail-files/${videoHash}/${i}.jpg`);
      continue;
    }

    const args = [
      '-ss', String(seekSeconds),
      '-i', videoPath,
      '-frames:v', '1',
      '-q:v', String(jpegQuality),
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
      '-y',
      outputPath,
    ];

    console.log(`[thumbnail] generating [${i}/${count}] for ${path.basename(videoPath)}`);

    const success = await new Promise<boolean>((resolve) => {
      execFile(ffmpeg, args, { timeout: 15000 }, (err, _stdout, stderr) => {
        if (err) {
          console.error(`[thumbnail] ffmpeg error [${i}]: ${err.message}`);
          if (stderr) console.error(`[thumbnail] ffmpeg stderr: ${stderr.slice(0, 300)}`);
          resolve(false);
          return;
        }
        console.log(`[thumbnail] generated [${i}/${count}]: ${outputPath}`);
        resolve(true);
      });
    });

    if (success) {
      urls.push(`/api/thumbnail-files/${videoHash}/${i}.jpg`);
    }
  }

  return { videoHash, urls };
}

export async function cleanupOldThumbnails(): Promise<void> {
  const thumbDir = getThumbnailDir();
  try {
    await fs.access(thumbDir);
  } catch {
    return;
  }

  try {
    const entries = await fs.readdir(thumbDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(thumbDir, entry.name);
        try {
          await fs.rm(dirPath, { recursive: true, force: true });
          console.log(`[thumbnail] cleaned up: ${dirPath}`);
        } catch (e: any) {
          console.warn(`[thumbnail] failed to clean ${dirPath}: ${e.message}`);
        }
      }
    }
  } catch (e: any) {
    console.warn(`[thumbnail] cleanup failed: ${e.message}`);
  }
}

export async function getThumbnailCacheSize(): Promise<number> {
  const thumbDir = getThumbnailDir();
  let totalSize = 0;
  try {
    await fs.access(thumbDir);
  } catch {
    return 0;
  }

  async function calcDirSize(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await calcDirSize(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = await fs.stat(fullPath);
          totalSize += stat.size;
        } catch {}
      }
    }
  }

  try {
    await calcDirSize(thumbDir);
  } catch {}
  return totalSize;
}

export async function clearThumbnailCache(): Promise<number> {
  const thumbDir = getThumbnailDir();
  let deletedCount = 0;
  try {
    await fs.access(thumbDir);
  } catch {
    return 0;
  }

  try {
    const entries = await fs.readdir(thumbDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(thumbDir, entry.name);
        try {
          await fs.rm(dirPath, { recursive: true, force: true });
          deletedCount++;
        } catch {}
      }
    }
  } catch {}
  return deletedCount;
}

export { findFfmpeg, findFfprobe };
