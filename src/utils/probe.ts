import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import { findFfprobe } from './thumbnail';

export interface VideoProbeResult {
  fileSize: number;
  duration: number;
  bitrate: number;
}

export async function probeVideoFile(filePath: string, ffprobeCmd?: string | null): Promise<VideoProbeResult> {
  let fileSize = 0;
  let duration = 0;
  let bitrate = 0;

  try {
    const stat = await fs.stat(filePath);
    fileSize = stat.size;
  } catch {}

  if (ffprobeCmd) {
    try {
      const probeResult = await new Promise<string>((resolve, reject) => {
        execFile(ffprobeCmd, [
          '-v', 'quiet',
          '-print_format', 'json',
          '-show_format',
          '-show_streams',
          filePath,
        ], { timeout: 10000 }, (err, stdout) => {
          err ? reject(err) : resolve(stdout);
        });
      });
      const probe = JSON.parse(probeResult);
      if (probe.format) {
        duration = parseFloat(probe.format.duration) || 0;
        bitrate = parseInt(probe.format.bit_rate, 10) || 0;
      }
    } catch {}
  }

  return { fileSize, duration, bitrate };
}

export async function resolveFfprobeCmd(binPath?: string): Promise<string | null> {
  return findFfprobe(binPath || undefined);
}
