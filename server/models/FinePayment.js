/* ============================================
   models/FinePayment.js - Fine Payment Record
   ============================================ */
const mongoose = require('mongoose');

const finePaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    issuedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IssuedBook',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    /* Path to uploaded payment receipt file */
    receiptPath: {
      type: String,
      default: null,
    },
    /* MIME type of the receipt (image/jpeg, image/png, application/pdf) */
    receiptType: {
      type: String,
      default: null,
    },
    /* Timestamp when the fine was marked as paid */
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinePayment', finePaymentSchema);
