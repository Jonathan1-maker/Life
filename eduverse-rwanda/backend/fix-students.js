require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

const cleanUrl = process.env.DATABASE_URL
  .replace(/[?&]channel_binding=[^&]*/g, '')
  .replace(/[?&]sslmode=[^&]*/g, '')
  .replace(/&&/g, '&')
  .replace(/[?&]$/, '');

const parsed = parse(cleanUrl);
const pool = new Pool({
  host: parsed.host,
  port: parsed.port || 5432,
  database: parsed.database,
  user: parsed.user,
  password: parsed.password,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    // List all students
    const { rows: students } = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, s.name as school_name
      FROM users u
      LEFT JOIN schools s ON s.id = u.school_id
      WHERE u.role = 'student'
      ORDER BY s.name, u.first_name
    `);

    if (!students.length) {
      console.log('❌ No students found in the database.');
      process.exit(0);
    }

    console.log(`\n📋 Found ${students.length} student(s):\n`);
    students.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.first_name} ${s.last_name} | ${s.email} | active: ${s.is_active} | school: ${s.school_name || 'N/A'}`);
    });

    // Reset ALL student passwords to Student@123 and ensure is_active = true
    const newPassword = 'Student@123';
    const hashed = await bcrypt.hash(newPassword, 12);

    const { rows: updated } = await pool.query(
      `UPDATE users SET password = $1, is_active = true WHERE role = 'student' RETURNING email`,
      [hashed]
    );

    console.log(`\n✅ Reset password for ${updated.length} student(s) to: ${newPassword}`);
    console.log('\n🎓 Any student above can now log in with:');
    console.log(`   Password: ${newPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
