import express from 'express';
import {
  getMe,
  getTransactions,
  requestWithdrawal,
  getWithdrawals,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect)

router.get('/me', getMe);
router.get('/transactions', getTransactions);
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getWithdrawals);


export default router;