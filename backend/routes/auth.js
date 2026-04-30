import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// ── Helper: Create and send JWT token ────────────────────────
const createSendToken = (user, statusCode, res) => {
  // Sign the token with the user's ID and our secret
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  // Remove password from output just in case
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    },
  });
};

// ── POST /api/auth/signup ─────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters.',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        status: 'fail',
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password gets hashed automatically via the pre-save hook)
    const newUser = await User.create({ firstName, lastName, email, password });

    createSendToken(newUser, 201, res);
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password.',
      });
    }

    // 2. Find user — we use .select('+password') because we set select:false above
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // 3. Check user exists AND password is correct
    // We check BOTH together — never reveal which one failed (security best practice)
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password.',
      });
    }

    // 4. All good — send token
    createSendToken(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
});

export default router;