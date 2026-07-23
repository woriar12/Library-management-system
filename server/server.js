/* ============================================
   server.js - Express Application Entry Point
   ============================================ */
require('dotenv').config();
const express = require('express');
const path    = require('path');
const cors    = require('cors');
const connectDB = require('./config/db');

// ── Import Routes ──────────────────────────
const authRoutes     = require('./routes/authRoutes');
const bookRoutes     = require('./routes/bookRoutes');
const studentRoutes  = require('./routes/studentRoutes');
const issueRoutes    = require('./routes/issueRoutes');
const fineRoutes     = require('./routes/fineRoutes');

// ── Connect Database ────────────────────────
connectDB();

const app = express();

// ── Global Middleware ───────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve Static Files (Frontend) ──────────
app.use(express.static(path.join(__dirname, '../client')));

// ── Serve Uploaded Files ────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ──────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/books',    bookRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/issues',   issueRoutes);
app.use('/api/fines',    fineRoutes);

// ── Admin Dashboard Stats ───────────────────
const { protect, adminOnly } = require('./middleware/auth');
const IssuedBook = require('./models/IssuedBook');
const Book       = require('./models/Book');
const Student    = require('./models/Student');
const FinePayment = require('./models/FinePayment');

app.get('/api/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalBooks    = await Book.countDocuments();
    const totalStudents = await Student.countDocuments();
    const booksIssued   = await IssuedBook.countDocuments({ status: 'issued' });
    const booksReturned = await IssuedBook.countDocuments({ status: 'returned' });

    // Auto-update overdue status
    const now = new Date();
    await IssuedBook.updateMany(
      { status: 'issued', dueDate: { $lt: now } },
      { $set: { status: 'overdue' } }
    );
    const overdueBooks = await IssuedBook.countDocuments({ status: 'overdue' });

    // Recent issued books (last 5)
    const recentIssues = await IssuedBook.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name uid')
      .populate('book', 'name author');

    res.json({
      success: true,
      stats: { totalBooks, totalStudents, booksIssued, booksReturned, overdueBooks },
      recentIssues,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Student Dashboard Stats ─────────────────
const { studentOnly } = require('./middleware/auth');

app.get('/api/student/stats', protect, studentOnly, async (req, res) => {
  try {
    const studentId = req.user.id;
    const FINE_RATE  = parseInt(process.env.FINE_RATE_PER_DAY) || 5; // ₹ per day
    const now        = new Date();

    // Auto-update overdue status
    await IssuedBook.updateMany(
      { student: studentId, status: 'issued', dueDate: { $lt: now } },
      { $set: { status: 'overdue' } }
    );

    // Auto-create FinePayment records for overdue books that don't have one yet
    const overdueBooks = await IssuedBook.find({
      student: studentId,
      status: 'overdue',
      fineStatus: 'none',           // only those without a fine record
    });

    for (const issue of overdueBooks) {
      const diffMs   = now - new Date(issue.dueDate);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const fineAmt  = diffDays * FINE_RATE;

      if (fineAmt > 0) {
        // Double-check no duplicate fine record exists
        const existing = await FinePayment.findOne({ issuedBook: issue._id, status: 'pending' });
        if (!existing) {
          await FinePayment.create({
            student:    studentId,
            issuedBook: issue._id,
            amount:     fineAmt,
            status:     'pending',
          });
          // Update fineStatus on the issued book
          await IssuedBook.findByIdAndUpdate(issue._id, {
            fine:       fineAmt,
            fineStatus: 'pending',
          });
        }
      }
    }

    // Update fine amount daily for already-pending overdue fines (amount grows each day)
    const existingPendingFines = await FinePayment.find({
      student: studentId,
      status:  'pending',
    }).populate('issuedBook');

    for (const fine of existingPendingFines) {
      const issue = fine.issuedBook;
      if (issue && issue.status === 'overdue') {
        const diffMs   = now - new Date(issue.dueDate);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const newAmt   = diffDays * FINE_RATE;
        if (newAmt !== fine.amount) {
          fine.amount = newAmt;
          await fine.save();
          await IssuedBook.findByIdAndUpdate(issue._id, { fine: newAmt });
        }
      }
    }

    const issuedBooks = await IssuedBook.find({ student: studentId, status: { $in: ['issued', 'overdue'] } })
      .populate('book', 'name author category');

    const returnedBooks = await IssuedBook.find({ student: studentId, status: 'returned' })
      .populate('book', 'name author category')
      .sort({ returnDate: -1 });

    const pendingFines = await FinePayment.find({ student: studentId, status: 'pending' })
      .populate({ path: 'issuedBook', populate: { path: 'book', select: 'name author' } });

    res.json({
      success: true,
      issuedBooks,
      returnedBooks,
      pendingFines,
      counts: {
        issued:   issuedBooks.length,
        returned: returnedBooks.length,
        fines:    pendingFines.reduce((sum, f) => sum + f.amount, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Catch-All: Serve Login Page ─────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

// ── Start Server ────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
