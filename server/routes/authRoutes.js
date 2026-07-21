/* ============================================
   routes/authRoutes.js
   ============================================ */
const express = require('express');
const router  = express.Router();
const { adminLogin, studentLogin, studentRegister } = require('../controllers/authController');

router.post('/admin/login',       adminLogin);
router.post('/student/login',     studentLogin);
router.post('/student/register',  studentRegister);

module.exports = router;
