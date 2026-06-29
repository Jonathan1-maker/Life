const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const globalSearch = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return success(res, []);

  const term = `%${q.trim()}%`;
  const school_id = req.user.school_id;
  const role = req.user.role;
  const results = [];

  if (role === 'super_admin') {
    const { rows: schools } = await pool.query(
      `SELECT id, name, email, 'school' as type FROM schools WHERE name ILIKE $1 OR email ILIKE $1 LIMIT 5`,
      [term]
    );
    schools.forEach(s => results.push({ id: s.id, label: s.name, sub: s.email, type: 'School', path: '/super-admin/schools' }));

    const { rows: users } = await pool.query(
      `SELECT id, first_name || ' ' || last_name as name, email, role FROM users WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1) LIMIT 5`,
      [term]
    );
    users.forEach(u => results.push({ id: u.id, label: u.name, sub: u.email, type: 'User', path: '/super-admin/users' }));
    return success(res, results);
  }

  if (!school_id) return success(res, []);

  // Students
  const { rows: students } = await pool.query(
    `SELECT u.id, u.first_name || ' ' || u.last_name as name, sp.admission_number, c.name as class_name
     FROM users u
     JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN classes c ON c.id = sp.class_id
     WHERE u.school_id=$1 AND u.role='student' AND (u.first_name ILIKE $2 OR u.last_name ILIKE $2 OR sp.admission_number ILIKE $2)
     LIMIT 5`,
    [school_id, term]
  );
  students.forEach(s => results.push({
    id: s.id, label: s.name, sub: `${s.class_name || '—'} · ${s.admission_number || ''}`,
    type: 'Student',
    path: role === 'school_admin' ? '/school-admin/students' : '/student/dashboard'
  }));

  if (['school_admin', 'super_admin'].includes(role)) {
    // Teachers
    const { rows: teachers } = await pool.query(
      `SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email
       FROM users u WHERE u.school_id=$1 AND u.role='teacher' AND (u.first_name ILIKE $2 OR u.last_name ILIKE $2 OR u.email ILIKE $2)
       LIMIT 5`,
      [school_id, term]
    );
    teachers.forEach(t => results.push({ id: t.id, label: t.name, sub: t.email, type: 'Teacher', path: '/school-admin/teachers' }));

    // Classes
    const { rows: classes } = await pool.query(
      `SELECT id, name FROM classes WHERE school_id=$1 AND name ILIKE $2 LIMIT 5`,
      [school_id, term]
    );
    classes.forEach(c => results.push({ id: c.id, label: c.name, sub: 'Class', type: 'Class', path: '/school-admin/classes' }));

    // Subjects
    const { rows: subjects } = await pool.query(
      `SELECT id, name FROM subjects WHERE school_id=$1 AND name ILIKE $2 LIMIT 5`,
      [school_id, term]
    );
    subjects.forEach(s => results.push({ id: s.id, label: s.name, sub: 'Subject', type: 'Subject', path: '/school-admin/subjects' }));
  }

  success(res, results);
};

module.exports = { globalSearch };
