/* ============================================
   controllers/authController.js
   Handles Admin Login, Student Login & Register
   ============================================ */
const jwt     = require('jsonwebtoken');
const Admin   = require('../models/Admin');
const Student = require('../models/Student');

/* ── Helper: Sign JWT ── */
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/* ── POST /api/auth/admin/login ── */
exports.adminLogin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // Validate input
    if (!adminId || !password) {
      return res.status(400).json({ success: false, message: 'Admin ID and password are required.' });
    }

    // Find admin by adminId
    const admin = await Admin.findOne({ adminId: adminId.toUpperCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid Admin ID or password.' });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Admin ID or password.' });
    }

    // Generate JWT
    const token = signToken(admin._id, 'admin');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        adminId: admin.adminId,
        role: 'admin',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/auth/student/login ── */
exports.studentLogin = async (req, res) => {
  try {
    const { uid, registerNumber, password } = req.body;

    // Validate input
    if (!uid || !registerNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'UID, register number, and password are required.',
      });
    }

    // Find student by both uid AND registerNumber
    const student = await Student.findOne({ uid, registerNumber });
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check if student is active
    if (!student.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact admin.' });
    }

    // Compare password
    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(student._id, 'student');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: student._id,
        name: student.name,
        uid: student.uid,
        registerNumber: student.registerNumber,
        role: 'student',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/auth/student/register ── */
exports.studentRegister = async (req, res) => {
  try {
    const { name, uid, registerNumber, department, year, email, mobile, password, confirmPassword } = req.body;

    // Validate required fields
    if (!name || !uid || !registerNumber || !department || !year || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Password match check
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Password length check
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check for duplicate uid
    const existingUid = await Student.findOne({ uid });
    if (existingUid) {
      return res.status(400).json({ success: false, message: 'UID already registered.' });
    }

    // Check for duplicate register number
    const existingReg = await Student.findOne({ registerNumber });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'Register number already registered.' });
    }

    // Check for duplicate email
    const existingEmail = await Student.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create student
    const student = await Student.create({
      name,
      uid,
      registerNumber,
      department,
      year,
      email: email.toLowerCase(),
      mobile,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. You can now log in.',
      student: { id: student._id, name: student.name, uid: student.uid },
    });
  } catch (err) {
    // Handle Mongoose duplicate key errors gracefully
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} already exists.` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
