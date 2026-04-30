import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config(); // loads your .env file

const app = express();

// ── Middleware ──────────────────────────────────────────────
// Allow your Vite frontend to talk to this backend
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true
}));

// Parse incoming JSON request bodies
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
// All auth routes live under /api/auth
app.use('/api/auth', authRoutes);

// Health check — visit http://localhost:5000/ to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: 'Crow Secure Holdings API is running ✓' });
});

// ── Connect to MongoDB then start server ─────────────────────
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
    process.exit(1); // stop the server if DB fails
  });