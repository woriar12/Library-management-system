/* ============================================
   routes/bookRoutes.js
   ============================================ */
const express = require('express');
const router  = express.Router();
const { getAllBooks, getBookById, addBook, updateBook, deleteBook, bulkImportBooks } = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/auth');

// Bulk import (must be before /:id to avoid conflict)
router.post('/bulk', protect, adminOnly, bulkImportBooks);

// Both roles can view books
router.get('/',    protect, getAllBooks);
router.get('/:id', protect, getBookById);

// Admin only
router.post('/',     protect, adminOnly, addBook);
router.put('/:id',   protect, adminOnly, updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;
