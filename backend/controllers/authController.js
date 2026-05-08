// controllers/authController.js
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// ─── Register ────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Password is hashed automatically by the pre('save') hook in User.js
    const user = await User.create({ fullName, email, password });

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: user._id, fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── Login ───────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Sign a JWT containing the user's ID and role
    // The frontend will attach this token to every protected request
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── Forgot Password ─────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Return the same message whether the email exists or not.
    // This prevents attackers from probing which emails are registered.
    if (!user) {
      return res.status(200).json({
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    // Generate a cryptographically secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your Crow Secure Password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password.</p>
          <a href="${resetLink}"
             style="display:inline-block;padding:12px 24px;background:#000;color:#fff;
                    text-decoration:none;border-radius:6px;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#888;font-size:12px;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    res.status(200).json({
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── Reset Password ──────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user whose token matches AND expiry is still in the future
    // $gt: new Date() means "resetTokenExpiry is greater than right now"
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    // Assign new password — pre('save') hook will hash it automatically
    user.password = newPassword;
    user.resetToken = null;        // Invalidate token so it can never be reused
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};