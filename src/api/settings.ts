import express from 'express';
import { SQLiteDb } from '../db/sqlite';
import { APP_NAME, APP_SHORT_NAME, APP_VERSION, BUILD_DATE, GITHUB_URL } from '../version';

const router = express.Router();

router.get('/version', (_req, res) => {
  res.json({
    success: true,
    appName: APP_NAME,
    appShortName: APP_SHORT_NAME,
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    githubUrl: GITHUB_URL,
  });
});

router.get('/settings/:key', (req, res) => {
  const { key } = req.params;
  const db = SQLiteDb.getInstance();
  const value = db.getSetting(key);
  res.json({ success: true, key, value: value ?? null });
});

router.post('/settings/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'value is required' });
  }
  const db = SQLiteDb.getInstance();
  db.setSetting(key, String(value));
  res.json({ success: true });
});

export default router;
