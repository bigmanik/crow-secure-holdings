import express from 'express';
import {
  getAllUsers,
  getUserById,
  injectPnL,
  setDeposit,
  getAllWithdrawals,
  resolveWithdrawal,
  updateUser,
  deleteUser,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Middleware FIRST — protects every route below this line
router.use(protect, adminOnly);

// ✅ Routes registered once
router.get('/users',              getAllUsers);
router.get('/users/:id',          getUserById);
router.patch('/users/:id/pnl',    injectPnL);
router.patch('/users/:id/deposit',setDeposit);
router.patch('/users/:id',        updateUser);
router.delete('/users/:id',       deleteUser);
router.get('/withdrawals',        getAllWithdrawals);
router.patch('/withdrawals/:id',  resolveWithdrawal);

export default router;