import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    principal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPnL: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0, // always kept as: principal + totalPnL
    },
  },
  { timestamps: true }
);

const Investment = mongoose.model('Investment', investmentSchema);
export default Investment;