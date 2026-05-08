// middleware/validationRules.js
import { body } from 'express-validator';

// --- Auth ---
export const registerRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .isEmail()
    .withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginRules = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const forgotPasswordRules = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required'),
];

export const resetPasswordRules = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// --- Deposit / PnL ---
export const depositRules = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
];

export const pnlRules = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('pnl')
    .isFloat()
    .withMessage('PnL must be a valid number'), // Can be negative (a loss)
];

// --- Withdrawal ---
export const withdrawalRules = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('walletAddress')
    .trim()
    .notEmpty()
    .withMessage('Wallet address is required'),
];