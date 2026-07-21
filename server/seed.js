/* ============================================
   seed.js - Creates Default Admin Account
   Run once: npm run seed
   ============================================ */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin    = require('./models/Admin');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();

  try {
    // Check if admin already exists
    const exists = await Admin.findOne({ adminId: 'ADMIN001' });
    if (exists) {
      console.log('⚠️  Admin already exists. Seed skipped.');
      process.exit(0);
    }

    // Create default admin
    await Admin.create({
      adminId: 'ADMIN001',
      name: 'Library Admin',
      password: 'Admin@123',
      role: 'admin',
    });

    console.log('✅ Admin seeded successfully!');
    console.log('   Admin ID : ADMIN001');
    console.log('   Password : Admin@123');
    console.log('   ⚠️  Change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
