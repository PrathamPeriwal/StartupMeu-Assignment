import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';

const app = express();
app.use(express.json({ limit: '100kb' }));
// Express 5 leaves req.body undefined when there's no JSON body; routes expect an object.
app.use((req, res, next) => { req.body ??= {}; next(); });
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// In production (Docker) the API also serves the built React app.
if (process.env.CLIENT_DIR) app.use(express.static(process.env.CLIENT_DIR));

// Express 5 forwards rejected promises from async handlers here.
app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const error = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ error });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid ${err.path}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Email is already registered' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;
