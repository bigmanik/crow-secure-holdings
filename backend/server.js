import 'dotenv/config'; // ✅ MUST be first — ESM hoists imports so this loads before everything

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import verifyToken from './middleware/verifyToken.js';
import requireAdmin from './middleware/requireAdmin.js';

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/user',  verifyToken, userRoutes);
app.use('/api/admin', verifyToken, requireAdmin, adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Crow Secure Holdings API is running ✓' });
});

// ── Database + Server ────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });