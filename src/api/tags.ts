import express from 'express';
import { SQLiteDb } from '../db/sqlite';

const router = express.Router();

router.get('/tags', (_req, res) => {
  const db = SQLiteDb.getInstance();
  const tags = db.getAllTags();
  res.json({ success: true, tags });
});

router.get('/tags/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid tag id' });
  }
  const db = SQLiteDb.getInstance();
  const tag = db.getTagById(id);
  if (!tag) {
    return res.status(404).json({ error: 'Tag not found' });
  }
  res.json({ success: true, tag });
});

router.post('/tags', (req, res) => {
  const { name, targetPath, description } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  if (!targetPath || typeof targetPath !== 'string' || targetPath.trim() === '') {
    return res.status(400).json({ error: 'Target path is required' });
  }
  const db = SQLiteDb.getInstance();
  try {
    const tag = db.createTag(name.trim(), targetPath.trim(), (description ?? '').trim());
    res.json({ success: true, tag });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Tag name already exists' });
    }
    res.status(500).json({ error: `Failed to create tag: ${err.message}` });
  }
});

router.put('/tags/reorder', (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: 'orderedIds must be a non-empty array' });
  }
  const db = SQLiteDb.getInstance();
  try {
    db.reorderTags(orderedIds);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to reorder tags: ${err.message}` });
  }
});

router.put('/tags/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid tag id' });
  }
  const { name, targetPath, description } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  if (!targetPath || typeof targetPath !== 'string' || targetPath.trim() === '') {
    return res.status(400).json({ error: 'Target path is required' });
  }
  const db = SQLiteDb.getInstance();
  try {
    const updated = db.updateTag(id, name.trim(), targetPath.trim(), (description ?? '').trim());
    if (!updated) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json({ success: true });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Tag name already exists' });
    }
    res.status(500).json({ error: `Failed to update tag: ${err.message}` });
  }
});

router.delete('/tags/:id', (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid tag id' });
  }
  const db = SQLiteDb.getInstance();
  const deleted = db.deleteTag(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Tag not found' });
  }
  res.json({ success: true });
});

export default router;
