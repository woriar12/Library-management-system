/* ============================================
   routes/fineRoutes.js
   ============================================ */
const express = require('express');
const router  = express.Router();
const { getAllFines, getMyFines, markFinePaid, uploadReceipt } = require('../controllers/fineController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin routes
router.get('/',           protect, adminOnly, getAllFines);
router.put('/:id/pay',    protect, adminOnly, markFinePaid);

// Student routes
router.get('/my',                   protect, studentOnly, getMyFines);
router.post('/:id/receipt',         protect, studentOnly, upload.single('receipt'), uploadReceipt);

module.exports = router;
