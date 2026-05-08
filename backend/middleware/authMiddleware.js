// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

// ─── Verify any logged-in user ────────────────────────────────
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Token must be sent as:  Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role } now available in every protected controller
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// ─── Admin-only gate (runs after protect) ────────────────────
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};