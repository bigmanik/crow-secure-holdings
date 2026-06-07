// controllers/authController.js
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import RefreshToken from '../models/RefreshToken.js';

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
 
    // Always return the same message — prevents email enumeration attacks
    const safeResponse = {
      message: 'If that email is registered, a reset link has been sent.',
    };
 
    if (!user) return res.status(200).json(safeResponse);
 
    // ── Generate & persist token ──────────────────────────────────────────
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
 
    // ── Build reset link ──────────────────────────────────────────────────
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
 
    // ── Send email — errors are logged but do NOT leak to the client ──────
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Crow Secure Password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;">
            <h2 style="margin-bottom:8px;">Password Reset Request</h2>
            <p>We received a request to reset the password for your Crow Secure Holdings account.</p>
            <a href="${resetLink}"
               style="display:inline-block;padding:12px 24px;background:#000;color:#fff;
                      text-decoration:none;border-radius:6px;margin:16px 0;font-weight:600;">
              Reset Password
            </a>
            <p style="color:#888;font-size:12px;margin-top:24px;">
              This link expires in <strong>1 hour</strong>.
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Email failed but we've already saved the token — log it and move on.
      // Returning a 500 here would reveal that the email exists in our system,
      // which breaks the enumeration-safe pattern above.
      console.error('⚠️  forgotPassword: email send failed:', emailErr.message);
    }
 
    return res.status(200).json(safeResponse);
 
  } catch (err) {
    // Catch unexpected errors (DB failures, etc.) and log the real reason
    console.error('❌ forgotPassword controller error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
 
// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
 
    // Find user whose token matches AND hasn't expired yet
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });
 
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }
 
    // pre('save') hook will hash the new password automatically
    user.password = newPassword;
    user.resetToken = null;         // Invalidate — one-time use only
    user.resetTokenExpiry = null;
    await user.save();
 
    return res.status(200).json({ message: 'Password updated successfully.' });
 
  } catch (err) {
    console.error('❌ resetPassword controller error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

//logout


export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    const deleted = await RefreshToken.findOneAndDelete({ token: refreshToken });

    if (!deleted) {
      // Token wasn't in DB — already logged out or never valid
      // Still return 200; don't leak info
      return res.status(200).json({ message: 'Logged out' });
    }

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error during logout' });
  }
};




