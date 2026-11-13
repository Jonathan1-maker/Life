require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

(async () => {
  try {
    // Get first active school
    const { rows: schools } = await pool.query(
      `SELECT id, name FROM schools WHERE status='active' ORDER BY created_at LIMIT 1`
    );

    if (!schools[0]) {
      console.error('❌ No active school found. Run seed.js first and create a school.');
      process.exit(1);
    }

    const school = schools[0];
    console.log(`🏫 Using school: ${school.name} (${school.id})`);

    const email = 'student@test.rw';
    const password = 'Student@123';
    const hashed = await bcrypt.hash(password, 12);

    // Check if already exists
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing[0]) {
      // Update to make sure it's active and password is correct
      await pool.query(
        `UPDATE users SET password=$1, is_active=true, school_id=$2 WHERE email=$3`,
        [hashed, school.id, email]
      );
      console.log(`✅ Updated existing student: ${email}`);
    } else {
      const { rows } = await pool.query(
        `INSERT INTO users (school_id, email, password, role, first_name, last_name, is_active, is_email_verified)
         VALUES ($1,$2,$3,'student','Test','Student',true,true) RETURNING id`,
        [school.id, email, hashed]
      );

      // Create student profile
      const year = new Date().getFullYear();
      await pool.query(
        `INSERT INTO student_profiles (user_id, school_id, admission_number, status)
         VALUES ($1,$2,$3,'active')`,
        [rows[0].id, school.id, `ADM-${year}-0001`]
      );
      console.log(`✅ Created student: ${email}`);
    }

    console.log(`\n🎓 Student login credentials:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
