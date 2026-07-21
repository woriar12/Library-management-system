/* ============================================
   middleware/upload.js - Multer File Upload
   ============================================ */
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

/* Ensure receipts upload directory exists */
const uploadDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* Disk storage configuration */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g. receipt-1710000000000.pdf
    const uniqueName = `receipt-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/* File filter: only allow JPG, PNG, PDF */
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = upload;
