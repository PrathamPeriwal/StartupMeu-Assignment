import mongoose from 'mongoose';
import app from './app.js';

const { MONGO_URL, JWT_SECRET, PORT = 4000 } = process.env;
if (!MONGO_URL || !JWT_SECRET) {
  console.error('MONGO_URL and JWT_SECRET must be set (see .env.example)');
  process.exit(1);
}

await mongoose.connect(MONGO_URL);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
