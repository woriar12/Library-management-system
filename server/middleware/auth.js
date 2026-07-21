/* ============================================
   middleware/auth.js - JWT Authentication
   ============================================ */
const jwt     = require('jsonwebtoken');
const Admin   = require('../models/Admin');
const Student = require('../models/Student');

/* ── protect: Verify JWT and attach user to req ── */
const protect = async (req, res, next) => {
  let token;

  // JWT is expected in Authorization header as: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }

    // Attach full user document
    if (decoded.role === 'admin') {
      req.user.doc = await Admin.findById(decoded.id).select('-password');
    } else {
      req.user.doc = await Student.findById(decoded.id).select('-password');
      // Block inactive students
      if (req.user.doc && !req.user.doc.isActive) {
        return res.status(403).json({ success: false, message: 'Your account has been blocked.' });
      }
    }

    if (!req.user.doc) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/* ── adminOnly: Allow only admins ── */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access only.' });
};

/* ── studentOnly: Allow only students ── */
const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  return res.status(403).json({ success: false, message: 'Student access only.' });
};

module.exports = { protect, adminOnly, studentOnly };
