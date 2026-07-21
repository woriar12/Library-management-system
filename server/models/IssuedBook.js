/* ============================================
   models/IssuedBook.js - Book Issue Record
   ============================================ */
const mongoose = require('mongoose');

const issuedBookSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    /* Status: issued → overdue/returned */
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
    },
    /* Fine amount (calculated on return) */
    fine: {
      type: Number,
      default: 0,
    },
    /* Fine payment status */
    fineStatus: {
      type: String,
      enum: ['none', 'pending', 'paid'],
      default: 'none',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IssuedBook', issuedBookSchema);
