import express from 'express';
import { SQLiteDb } from '../db/sqlite';

const router = express.Router();

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
