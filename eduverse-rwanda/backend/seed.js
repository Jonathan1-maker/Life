require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

const seed = async () => {
  try {
    console.log('📦 Running schema...');
    const schema = fs.readFileSync(path.join(__dirname, 'src/config/schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('✅ Schema created');

    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@eduverse.rw';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2025';
    const hashed = await bcrypt.hash(password, 12);

    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!rows[0]) {
      await pool.query(
        `INSERT INTO users (email, password, role, first_name, last_name, is_active, is_email_verified)
         VALUES ($1,$2,'super_admin','Super','Admin',true,true)`,
        [email, hashed]
      );
      console.log(`✅ Super Admin created: ${email}`);
    } else {
      console.log('ℹ️  Super Admin already exists');
    }

    console.log('🚀 Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
