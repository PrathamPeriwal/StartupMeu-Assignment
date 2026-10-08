import mongoose from 'mongoose';

export const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];

const applicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: STATUSES, default: 'wishlist' },
    location: { type: String, trim: true, maxlength: 120 },
    link: { type: String, trim: true, match: [/^https?:\/\//, 'Link must start with http(s)://'] },
    notes: { type: String, maxlength: 5000 },
    appliedOn: Date,
  },
  { timestamps: true },
);

export default mongoose.model('Application', applicationSchema);
