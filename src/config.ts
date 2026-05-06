import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  watchPath: path.resolve(getEnv('WATCH_PATH', './input')),
  filePattern: getEnv('FILE_PATTERN', '*.mp4'),
  outputTemplate: path.resolve(getEnv('OUTPUT_TEMPLATE', './output/{tag}/{filename}')),
  overwrite: getEnv('OVERWRITE', 'false').toLowerCase() === 'true',
  concurrency: parseInt(getEnv('CONCURRENCY', '5'), 10),
};
