import { Router } from 'express';
import User from '../models/User.js';
import { clearAuthCookie, requireAuth, setAuthCookie } from '../lib/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();
  setAuthCookie(res, user._id);
  res.status(201).json(user);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = typeof email === 'string' && (await User.findOne({ email: email.toLowerCase() }).select('+passwordHash'));
  if (!user || typeof password !== 'string' || !(await user.checkPassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  setAuthCookie(res, user._id);
  res.json(user);
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(user);
});

export default router;
