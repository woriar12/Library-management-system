/* ============================================
   controllers/studentController.js
   Student CRUD for Admin + Profile for Student
   ============================================ */
const Student    = require('../models/Student');
const IssuedBook = require('../models/IssuedBook');

/* ── GET /api/students?search=&page=&limit= ── (Admin) */
exports.getAllStudents = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { uid: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      students,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/students/:id ── (Admin) */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Get current issued books count
    const issuedCount = await IssuedBook.countDocuments({
      student: student._id,
      status: { $in: ['issued', 'overdue'] },
    });

    res.json({ success: true, student, issuedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/students/profile ── (Student - own profile) */
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /api/students/profile ── (Student - update own profile) */
exports.updateStudentProfile = async (req, res) => {
  try {
    const { name, email, mobile, department, year } = req.body;

    // Email uniqueness check (excluding self)
    if (email) {
      const existing = await Student.findOne({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    const updated = await Student.findByIdAndUpdate(
      req.user.id,
      { name, email: email?.toLowerCase(), mobile, department, year },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, message: 'Profile updated successfully.', student: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
