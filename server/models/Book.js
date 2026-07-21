/* ============================================
   models/Book.js - Book Model
   ============================================ */
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Book name is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
    },
  },
  { timestamps: true }
);

/* Auto-generate bookId before saving a new document */
bookSchema.pre('save', async function (next) {
  if (this.isNew && !this.bookId) {
    try {
      const count = await mongoose.model('Book').countDocuments();
      this.bookId = `BK${String(count + 1).padStart(4, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
