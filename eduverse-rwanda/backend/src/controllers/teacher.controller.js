const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { success, paginate } = require('../utils/response.utils');

const getTeachers = async (req, res) => {
  const { page = 1, limit = 20, search, department_id } = req.query;
  const school_id = req.user.school_id;
  const offset = (page - 1) * limit;

  const params = [school_id];
  const where = [`u.school_id = $1`, `u.role = 'teacher'`];
  if (department_id) { params.push(department_id); where.push(`tp.department_id = $${params.length}`); }
  if (search) { params.push(`%${search}%`); where.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`); }

  const countRes = await pool.query(`SELECT COUNT(*) FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id WHERE ${where.join(' AND ')}`, params);
  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.gender,
            tp.employee_id, tp.qualification, tp.specialization, tp.employment_type, tp.join_date,
            d.name as department_name
     FROM users u
     LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     LEFT JOIN departments d ON d.id = tp.department_id
     WHERE ${where.join(' AND ')}
     ORDER BY u.first_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  paginate(res, rows, parseInt(countRes.rows[0].count), page, limit);
};

const getTeacher = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.*, tp.employee_id, tp.qualification, tp.specialization, tp.employment_type, tp.join_date, d.name as department_name
     FROM users u
     LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     LEFT JOIN departments d ON d.id = tp.department_id
     WHERE u.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Teacher not found' });
  delete rows[0].password;
  success(res, rows[0]);
};

const createTeacher = async (req, res) => {
  const { email, password, first_name, last_name, phone, gender, department_id, employee_id, qualification, specialization, employment_type, join_date } = req.body;
  const school_id = req.user.school_id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hashed = await bcrypt.hash(password || 'Teacher@123', 12);
    const { rows } = await client.query(
      `INSERT INTO users (school_id, email, password, role, first_name, last_name, phone, gender) VALUES ($1,$2,$3,'teacher',$4,$5,$6,$7) RETURNING id`,
      [school_id, email, hashed, first_name, last_name, phone, gender]
    );
    await client.query(
      `INSERT INTO teacher_profiles (user_id, school_id, department_id, employee_id, qualification, specialization, employment_type, join_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [rows[0].id, school_id, department_id, employee_id, qualification, specialization, employment_type, join_date]
    );
    await client.query('COMMIT');
    success(res, { id: rows[0].id }, 'Teacher created', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteTeacher = async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  success(res, null, 'Teacher deleted');
};

const updateTeacher = async (req, res) => {
  const { first_name, last_name, phone, gender, qualification, specialization, employment_type, join_date } = req.body;
  await pool.query(
    `UPDATE users SET first_name=$1, last_name=$2, phone=$3, gender=$4, updated_at=NOW() WHERE id=$5`,
    [first_name, last_name, phone, gender, req.params.id]
  );
  await pool.query(
    `UPDATE teacher_profiles SET qualification=$1, specialization=$2, employment_type=$3, join_date=$4 WHERE user_id=$5`,
    [qualification, specialization, employment_type, join_date, req.params.id]
  );
  success(res, null, 'Teacher updated');
};

const getTeacherSubjects = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ts.*, s.name as subject_name, c.name as class_name FROM teacher_subjects ts
     JOIN subjects s ON s.id = ts.subject_id JOIN classes c ON c.id = ts.class_id
     WHERE ts.teacher_id = $1`,
    [req.params.id]
  );
  success(res, rows);
};

const getMyAssignments = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ts.subject_id, ts.class_id, s.name as subject_name, c.name as class_name,
            COUNT(DISTINCT sp.user_id) as student_count
     FROM teacher_subjects ts
     JOIN subjects s ON s.id = ts.subject_id
     JOIN classes c ON c.id = ts.class_id
     LEFT JOIN student_profiles sp ON sp.class_id = ts.class_id
     WHERE ts.teacher_id = $1
     GROUP BY ts.subject_id, ts.class_id, s.name, c.name
     ORDER BY c.name, s.name`,
    [req.user.id]
  );
  success(res, rows);
};

const assignSubject = async (req, res) => {
  const { subject_id, class_id, stream_id, academic_year_id } = req.body;
  const school_id = req.user.school_id;

  let yearId = academic_year_id || null;
  if (!yearId) {
    const { rows: years } = await pool.query(
      `SELECT id FROM academic_years WHERE school_id=$1 AND is_current=true LIMIT 1`,
      [school_id]
    );
    if (years[0]) yearId = years[0].id;
  }

  const { rows } = await pool.query(
    `INSERT INTO teacher_subjects (school_id, teacher_id, subject_id, class_id, stream_id, academic_year_id)
     VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING *`,
    [school_id, req.params.id, subject_id, class_id, stream_id || null, yearId]
  ).catch(async (err) => {
    // If academic_year_id has NOT NULL constraint, make it nullable then retry
    if (err.code === '23502' && err.column === 'academic_year_id') {
      await pool.query(`ALTER TABLE teacher_subjects ALTER COLUMN academic_year_id DROP NOT NULL`).catch(() => {});
      return pool.query(
        `INSERT INTO teacher_subjects (school_id, teacher_id, subject_id, class_id, stream_id, academic_year_id)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING *`,
        [school_id, req.params.id, subject_id, class_id, stream_id || null, yearId]
      );
    }
    throw err;
  });
  success(res, rows[0], 'Subject assigned', 201);
};

const removeSubject = async (req, res) => {
  await pool.query(
    `DELETE FROM teacher_subjects WHERE teacher_id=$1 AND class_id=$2 AND subject_id=$3`,
    [req.params.id, req.body.class_id, req.body.subject_id]
  );
  success(res, null, 'Assignment removed');
};

module.exports = { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, getTeacherSubjects, getMyAssignments, assignSubject, removeSubject };
