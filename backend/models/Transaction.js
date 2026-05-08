import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['pnl_credit', 'pnl_debit', 'deposit', 'withdrawal'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ['fixed', 'percent'],
      default: 'fixed',
    },
    adminNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;