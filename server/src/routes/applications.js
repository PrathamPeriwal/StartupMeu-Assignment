import { Router } from 'express';
import mongoose from 'mongoose';
import Application, { STATUSES } from '../models/Application.js';
import { requireAuth } from '../lib/auth.js';

const router = Router();
router.use(requireAuth);

const EDITABLE = ['company', 'role', 'status', 'location', 'link', 'notes', 'appliedOn'];

// Whitelist fields so clients can't set `user` or timestamps.
const pick = (body) => Object.fromEntries(EDITABLE.filter((k) => k in body).map((k) => [k, body[k]]));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res) => {
  const filter = { user: req.userId };
  const { q, status } = req.query;
  if (typeof status === 'string' && STATUSES.includes(status)) filter.status = status;
  if (typeof q === 'string' && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ company: rx }, { role: rx }, { location: rx }];
  }
  // ponytail: hard cap instead of pagination; a personal job hunt stays well under it.
  res.json(await Application.find(filter).sort({ updatedAt: -1 }).limit(500));
});

router.get('/stats', async (req, res) => {
  const rows = await Application.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const { _id, count } of rows) byStatus[_id] = count;

  const total = rows.reduce((n, r) => n + r.count, 0);
  const sent = total - byStatus.wishlist;
  const heardBack = byStatus.interview + byStatus.offer + byStatus.rejected;
  res.json({ total, byStatus, responseRate: sent ? Math.round((heardBack / sent) * 100) : 0 });
});

router.post('/', async (req, res) => {
  const app = await Application.create({ ...pick(req.body), user: req.userId });
  res.status(201).json(app);
});

router.patch('/:id', async (req, res) => {
  const app = await Application.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    pick(req.body),
    { returnDocument: 'after', runValidators: true },
  );
  if (!app) return res.status(404).json({ error: 'Application not found' });
  res.json(app);
});

router.delete('/:id', async (req, res) => {
  const { deletedCount } = await Application.deleteOne({ _id: req.params.id, user: req.userId });
  if (!deletedCount) return res.status(404).json({ error: 'Application not found' });
  res.status(204).end();
});

export default router;
