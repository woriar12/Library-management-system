/* ============================================
   routes/issueRoutes.js
   ============================================ */
const express = require('express');
const router  = express.Router();
const { issueBook, getAllIssues, getMyIssues, returnBook } = require('../controllers/issueController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');

// Admin routes
router.post('/',              protect, adminOnly, issueBook);
router.get('/',               protect, adminOnly, getAllIssues);
router.put('/:id/return',     protect, adminOnly, returnBook);

// Student routes
router.get('/my',             protect, studentOnly, getMyIssues);

module.exports = router;
