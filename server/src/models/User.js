import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import mongoose from 'mongoose';

const scryptAsync = promisify(scrypt);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

// Stored as "salt:hash", both hex.
userSchema.methods.setPassword = async function (password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, 64);
  this.passwordHash = `${salt}:${hash.toString('hex')}`;
};

userSchema.methods.checkPassword = async function (password) {
  const [salt, stored] = this.passwordHash.split(':');
  const hash = await scryptAsync(password, salt, 64);
  return timingSafeEqual(hash, Buffer.from(stored, 'hex'));
};

userSchema.methods.toJSON = function () {
  return { id: this._id, name: this.name, email: this.email };
};

export default mongoose.model('User', userSchema);
