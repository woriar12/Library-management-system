/* ============================================
   controllers/fineController.js
   View Fines, Mark Paid, Upload Receipt
   ============================================ */
const FinePayment = require('../models/FinePayment');
const IssuedBook  = require('../models/IssuedBook');

/* ── GET /api/fines?status=&page=&limit= ── (Admin) */
exports.getAllFines = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await FinePayment.countDocuments(query);
    const fines = await FinePayment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('student', 'name uid registerNumber')
      .populate({
        path: 'issuedBook',
        populate: { path: 'book', select: 'name author' },
      });

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      fines,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/fines/my ── (Student: own fines) */
exports.getMyFines = async (req, res) => {
  try {
    const fines = await FinePayment.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'issuedBook',
        populate: { path: 'book', select: 'name author' },
      });

    res.json({ success: true, fines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /api/fines/:id/pay ── (Admin: mark fine as paid) */
exports.markFinePaid = async (req, res) => {
  try {
    const fine = await FinePayment.findById(req.params.id);
    if (!fine) return res.status(404).json({ success: false, message: 'Fine record not found.' });
    if (fine.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Fine is already marked as paid.' });
    }

    fine.status = 'paid';
    fine.paidAt = new Date();
    await fine.save();

    // Update fineStatus on the issued book record as well
    await IssuedBook.findByIdAndUpdate(fine.issuedBook, { fineStatus: 'paid' });

    res.json({ success: true, message: 'Fine marked as paid.', fine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/fines/:id/receipt ── (Student: upload payment receipt) */
exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const fine = await FinePayment.findById(req.params.id);
    if (!fine) return res.status(404).json({ success: false, message: 'Fine record not found.' });

    // Ensure this fine belongs to the logged-in student
    if (fine.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (fine.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Fine is already paid.' });
    }

    // Save receipt path relative to server
    fine.receiptPath = `/uploads/receipts/${req.file.filename}`;
    fine.receiptType = req.file.mimetype;
    await fine.save();

    res.json({ success: true, message: 'Receipt uploaded successfully.', fine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
