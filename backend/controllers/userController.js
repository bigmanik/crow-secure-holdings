import User from '../models/User.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';

// GET /api/user/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const investment = await Investment.findOne({ userId: req.user.id });

    const roi =
      investment && investment.principal > 0
        ? ((investment.totalPnL / investment.principal) * 100).toFixed(2)
        : '0.00';

    res.json({
      user,               // toJSON() on the model already strips password + __v
      investment: investment || null,
      roi: parseFloat(roi),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/user/transactions
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/user/withdraw
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, walletAddress } = req.body;

    if (!amount || !walletAddress) {
      return res.status(400).json({ message: 'Amount and wallet address are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const investment = await Investment.findOne({ userId: req.user.id });

    if (!investment || investment.currentBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check for existing pending withdrawal
    const pendingExists = await Withdrawal.findOne({
      userId: req.user.id,
      status: 'pending',
    });

    if (pendingExists) {
      return res.status(400).json({
        message: 'You already have a pending withdrawal request',
      });
    }

    const withdrawal = await Withdrawal.create({
      userId: req.user.id,
      amount,
      walletAddress,
    });

    res.status(201).json({ message: 'Withdrawal request submitted', withdrawal });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/user/withdrawals
export const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ withdrawals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};