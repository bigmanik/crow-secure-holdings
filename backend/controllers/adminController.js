// controllers/adminController.js
import User from '../models/User.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import sendEmail from '../utils/sendEmail.js';

// ─── GET /api/admin/users (paginated) ────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // Count only regular users (not admins)
    const total = await User.countDocuments({ role: 'user' });

    const users = await User.find({ role: 'user' }, '-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Attach each user's investment record
    const usersWithData = await Promise.all(
      users.map(async (u) => {
        const investment = await Investment.findOne({ userId: u._id });
        return { ...u.toJSON(), investment: investment || null };
      })
    );

    res.status(200).json({
      users: usersWithData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/admin/users/:id ─────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [investment, transactions] = await Promise.all([
      Investment.findOne({ userId: req.params.id }),
      Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 }),
    ]);

    res.json({ user, investment: investment || null, transactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/admin/users/:id/pnl ──────────────────────────
export const injectPnL = async (req, res) => {
  try {
    const { mode, value, type, note } = req.body;

    if (!['fixed', 'percent'].includes(mode)) {
      return res.status(400).json({ message: 'mode must be "fixed" or "percent"' });
    }
    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ message: 'type must be "credit" or "debit"' });
    }
    if (typeof value !== 'number' || value <= 0) {
      return res.status(400).json({ message: 'value must be a positive number' });
    }

    let investment = await Investment.findOne({ userId: req.params.id });
    if (!investment) {
      investment = await Investment.create({
        userId: req.params.id,
        principal: 0,
        totalPnL: 0,
        currentBalance: 0,
      });
    }

    const amount =
      mode === 'percent'
        ? (value / 100) * investment.principal
        : value;

    if (type === 'credit') {
      investment.totalPnL += amount;
    } else {
      investment.totalPnL -= amount;
    }

    investment.currentBalance = investment.principal + investment.totalPnL;
    await investment.save();

    const transaction = await Transaction.create({
      userId: req.params.id,
      type: type === 'credit' ? 'pnl_credit' : 'pnl_debit',
      amount,
      mode,
      adminNote: note || '',
    });

    res.json({ message: 'PnL updated successfully', investment, transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/admin/users/:id/deposit ──────────────────────
export const setDeposit = async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }

    let investment = await Investment.findOne({ userId: req.params.id });
    if (!investment) {
      investment = await Investment.create({
        userId: req.params.id,
        principal: amount,
        totalPnL: 0,
        currentBalance: amount,
      });
    } else {
      investment.principal = amount;
      investment.currentBalance = investment.principal + investment.totalPnL;
      await investment.save();
    }

    await Transaction.create({
      userId: req.params.id,
      type: 'deposit',
      amount,
      mode: 'fixed',
      adminNote: 'Principal set by admin',
    });

    res.json({ message: 'Deposit recorded', investment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/admin/withdrawals (paginated) ───────────────────
export const getAllWithdrawals = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    // Count only pending withdrawals for the queue view
    const total = await Withdrawal.countDocuments({ status: 'pending' });

    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      withdrawals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/admin/withdrawals/:id ────────────────────────
export const resolveWithdrawal = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "approved" or "rejected"' });
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('userId', 'firstName lastName email');
      // .populate('userId') because your Withdrawal model uses userId not user

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already resolved' });
    }

    withdrawal.status = status;
    withdrawal.resolvedAt = new Date();
    await withdrawal.save();

    // ── Deduct from balance if approved ──────────────────────
    if (status === 'approved') {
      const investment = await Investment.findOne({ userId: withdrawal.userId._id });
      if (investment) {
        investment.currentBalance -= withdrawal.amount;
        investment.totalPnL -= withdrawal.amount;
        await investment.save();

        await Transaction.create({
          userId: withdrawal.userId._id,
          type: 'withdrawal',
          amount: withdrawal.amount,
          mode: 'fixed',
          adminNote: 'Withdrawal approved by admin',
        });
      }
    }

    // ── Send email notification ───────────────────────────────
    // withdrawal.userId is now the full user object after .populate()
    const { email, firstName } = withdrawal.userId;

    if (status === 'approved') {
      await sendEmail({
        to: email,
        subject: 'Withdrawal Approved — Crow Secure Holdings',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;">
            <h2>Withdrawal Approved ✅</h2>
            <p>Hi ${firstName},</p>
            <p>Your withdrawal of <strong>$${withdrawal.amount}</strong> has been approved.
               Funds will arrive within 24–48 hours.</p>
          </div>
        `,
      });
    } else {
      await sendEmail({
        to: email,
        subject: 'Withdrawal Update — Crow Secure Holdings',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;">
            <h2>Withdrawal Could Not Be Processed</h2>
            <p>Hi ${firstName},</p>
            <p>Your withdrawal request of <strong>$${withdrawal.amount}</strong> could
               not be processed at this time. Please contact support for assistance.</p>
          </div>
        `,
      });
    }

    res.status(200).json({ message: `Withdrawal ${status}`, withdrawal });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/admin/users/:id ──────────────────────────────
export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, isActive },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── DELETE /api/admin/users/:id ─────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clean up all related data in parallel
    await Promise.all([
      Investment.deleteMany({ userId: req.params.id }),
      Transaction.deleteMany({ userId: req.params.id }),
      Withdrawal.deleteMany({ userId: req.params.id }),
    ]);

    res.json({ message: 'User and all related data deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};