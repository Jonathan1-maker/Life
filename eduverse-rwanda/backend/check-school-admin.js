require('dotenv').config();
const { parse } = require('pg-connection-string');

const connectionString = process.env.DATABASE_URL;
const parsed = parse(connectionString);
delete parsed.channel_binding;
const sslmode = parsed.sslmode;
delete parsed.sslmode;

const { Pool } = require('pg');
const pool = new Pool({ ...parsed, ssl: { rejectUnauthorized: false } });

async function main() {
  // Show all school_admin users and their school_id
  const { rows: admins } = await pool.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.school_id, s.name as school_name
    FROM users u
    LEFT JOIN schools s ON s.id = u.school_id
    WHERE u.role = 'school_admin'
    ORDER BY u.created_at
  `);

  console.log('\n=== School Admin Users ===');
  admins.forEach(a => {
    console.log(`  ${a.email} | school_id: ${a.school_id || 'NULL ❌'} | school: ${a.school_name || 'NOT LINKED'}`);
  });

  // Find admins with null school_id and try to fix them
  const broken = admins.filter(a => !a.school_id);
  if (broken.length === 0) {
    console.log('\n✅ All school admins have a school_id — the issue is elsewhere.');
  } else {
    console.log(`\n⚠️  Found ${broken.length} school admin(s) with no school_id.`);

    // Get all schools
    const { rows: schools } = await pool.query('SELECT id, name FROM schools ORDER BY created_at');
    console.log('\nAvailable schools:');
    schools.forEach((s, i) => console.log(`  [${i}] ${s.name} (${s.id})`));

    if (schools.length === 1 && broken.length === 1) {
      console.log(`\nAuto-fixing: linking ${broken[0].email} → ${schools[0].name}`);
      await pool.query('UPDATE users SET school_id=$1 WHERE id=$2', [schools[0].id, broken[0].id]);
      console.log('✅ Fixed!');
    } else {
      console.log('\nRun this SQL to fix manually:');
      broken.forEach(a => {
        console.log(`  UPDATE users SET school_id='<SCHOOL_UUID>' WHERE id='${a.id}'; -- ${a.email}`);
      });
    }
  }

  // Also show school data counts
  console.log('\n=== School Data Counts ===');
  const { rows: schools } = await pool.query('SELECT id, name FROM schools');
  for (const s of schools) {
    const [students, teachers, classes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE school_id=$1 AND role='student'", [s.id]),
      pool.query("SELECT COUNT(*) FROM users WHERE school_id=$1 AND role='teacher'", [s.id]),
      pool.query('SELECT COUNT(*) FROM classes WHERE school_id=$1', [s.id]),
    ]);
    console.log(`  ${s.name}: ${students.rows[0].count} students, ${teachers.rows[0].count} teachers, ${classes.rows[0].count} classes`);
  }

  await pool.end();
}

main().catch(console.error);
