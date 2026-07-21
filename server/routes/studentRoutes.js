/* ============================================
   routes/studentRoutes.js
   ============================================ */
const express = require('express');
const router  = express.Router();
const {
  getAllStudents,
  getStudentById,
  getStudentProfile,
  updateStudentProfile,
} = require('../controllers/studentController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');

// Student - own profile routes
router.get('/profile',    protect, studentOnly, getStudentProfile);
router.put('/profile',    protect, studentOnly, updateStudentProfile);

// Admin - manage all students
router.get('/',           protect, adminOnly, getAllStudents);
router.get('/:id',        protect, adminOnly, getStudentById);

module.exports = router;
