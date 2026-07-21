/* ============================================
   controllers/issueController.js
   Issue Book, Return Book, View Issued Records
   ============================================ */
const IssuedBook  = require('../models/IssuedBook');
const Book        = require('../models/Book');
const Student     = require('../models/Student');
const FinePayment = require('../models/FinePayment');

const FINE_RATE = parseInt(process.env.FINE_RATE_PER_DAY) || 5; // ₹ per day

/* ── POST /api/issues ── (Admin: issue a book) */
exports.issueBook = async (req, res) => {
  try {
    const { studentId, bookId, issueDate, dueDate } = req.body;

    if (!studentId || !bookId || !dueDate) {
      return res.status(400).json({ success: false, message: 'Student, book, and due date are required.' });
    }

    // Validate student
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (!student.isActive) return res.status(400).json({ success: false, message: 'Student account is blocked.' });

    // Validate book
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });
    if (book.availableQuantity < 1) {
      return res.status(400).json({ success: false, message: 'No copies available for this book.' });
    }

    // Check student doesn't already have this book
    const existing = await IssuedBook.findOne({
      student: studentId,
      book: bookId,
      status: { $in: ['issued', 'overdue'] },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Student already has this book.' });
    }

    // Create issue record
    const issue = await IssuedBook.create({
      student: studentId,
      book: bookId,
      issueDate: issueDate || new Date(),
      dueDate: new Date(dueDate),
      status: 'issued',
    });

    // Reduce available quantity
    await Book.findByIdAndUpdate(bookId, { $inc: { availableQuantity: -1 } });

    // Populate for response
    const populated = await IssuedBook.findById(issue._id)
      .populate('student', 'name uid registerNumber')
      .populate('book', 'name author bookId');

    res.status(201).json({ success: true, message: 'Book issued successfully.', issue: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/issues?status=&page=&limit= ── (Admin) */
exports.getAllIssues = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    // Auto-mark overdue
    await IssuedBook.updateMany(
      { status: 'issued', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await IssuedBook.countDocuments(query);
    const issues = await IssuedBook.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('student', 'name uid registerNumber')
      .populate('book', 'name author bookId');

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      issues,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/issues/my ── (Student: own issued books) */
exports.getMyIssues = async (req, res) => {
  try {
    // Auto-mark overdue for this student
    await IssuedBook.updateMany(
      { student: req.user.id, status: 'issued', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );

    const issues = await IssuedBook.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .populate('book', 'name author category');

    res.json({ success: true, issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /api/issues/:id/return ── (Admin: return a book) */
exports.returnBook = async (req, res) => {
  try {
    const issue = await IssuedBook.findById(req.params.id).populate('book');
    if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found.' });

    if (issue.status === 'returned') {
      return res.status(400).json({ success: false, message: 'This book has already been returned.' });
    }

    const returnDate = new Date();
    const dueDate    = new Date(issue.dueDate);
    let fine         = 0;
    let fineStatus   = 'none';

    // Calculate fine if overdue
    if (returnDate > dueDate) {
      const diffMs   = returnDate - dueDate;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fine = diffDays * FINE_RATE;
      fineStatus = 'pending';
    }

    // Update issue record
    issue.returnDate = returnDate;
    issue.status     = 'returned';
    issue.fine       = fine;
    issue.fineStatus = fineStatus;
    await issue.save();

    // Increase available quantity
    await Book.findByIdAndUpdate(issue.book._id, { $inc: { availableQuantity: 1 } });

    // Create fine payment record if fine exists
    if (fine > 0) {
      await FinePayment.create({
        student: issue.student,
        issuedBook: issue._id,
        amount: fine,
        status: 'pending',
      });
    }

    const updatedIssue = await IssuedBook.findById(issue._id)
      .populate('student', 'name uid')
      .populate('book', 'name author');

    res.json({
      success: true,
      message: fine > 0
        ? `Book returned. Fine: ₹${fine} (${Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24))} days overdue)`
        : 'Book returned successfully. No fine.',
      issue: updatedIssue,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
