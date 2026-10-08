import jwt from 'jsonwebtoken';

const COOKIE = 'token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE);
}

export function requireAuth(req, res, next) {
  try {
    req.userId = jwt.verify(req.cookies[COOKIE], process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'Not authenticated' });
  }
}
