// Creates (or resets) a demo account with sample data: `npm run seed`.
import mongoose from 'mongoose';
import User from './models/User.js';
import Application from './models/Application.js';

const EMAIL = 'demo@jobtrail.dev';
const PASSWORD = 'password123';

const SAMPLES = [
  ['Stripe', 'Backend Engineer', 'applied', 'Remote'],
  ['Vercel', 'Frontend Engineer', 'interview', 'Remote'],
  ['Atlassian', 'Full Stack Developer', 'offer', 'Bengaluru'],
  ['Razorpay', 'SDE II', 'rejected', 'Bengaluru'],
  ['Notion', 'Product Engineer', 'wishlist', 'San Francisco'],
  ['MongoDB', 'Developer Advocate', 'applied', 'Gurugram'],
];

await mongoose.connect(process.env.MONGO_URL);

let user = await User.findOne({ email: EMAIL });
if (!user) {
  user = new User({ name: 'Demo User', email: EMAIL });
  await user.setPassword(PASSWORD);
  await user.save();
}
await Application.deleteMany({ user: user._id });
await Application.insertMany(
  SAMPLES.map(([company, role, status, location]) => ({ user: user._id, company, role, status, location })),
);

console.log(`Seeded ${SAMPLES.length} applications. Log in as ${EMAIL} / ${PASSWORD}`);
await mongoose.disconnect();
