// models/RefreshToken.js

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date, required: true }
});

// Auto-delete expired tokens — MongoDB TTL index
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);