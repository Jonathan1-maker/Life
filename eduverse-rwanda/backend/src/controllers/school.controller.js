const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { success, paginate } = require('../utils/response.utils');

const getAllSchools = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1'];
  const params = [];

  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }

  const countRes = await pool.query(`SELECT COUNT(*) FROM schools WHERE ${where.join(' AND ')}`, params);
  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT * FROM schools WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  paginate(res, rows, parseInt(countRes.rows[0].count), page, limit);
};

const getSchool = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM schools WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'School not found' });
  success(res, rows[0]);
};

const createSchool = async (req, res) => {
  const {
    name, slug, email, phone, address, city, province, type,
    subscription_plan, subscription_start, subscription_end,
    max_students, max_teachers,
    admin_first_name, admin_last_name, admin_email, admin_password,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO schools (name, slug, email, phone, address, city, province, type, status, subscription_plan, subscription_start, subscription_end, max_students, max_teachers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10,$11,$12,$13) RETURNING *`,
      [name, slug, email, phone, address, city, province, type, subscription_plan, subscription_start, subscription_end, max_students, max_teachers]
    );

    const school = rows[0];
    const hashed = await bcrypt.hash(admin_password, 12);
    await client.query(
      `INSERT INTO users (school_id, email, password, role, first_name, last_name) VALUES ($1,$2,$3,'school_admin',$4,$5)`,
      [school.id, admin_email, hashed, admin_first_name, admin_last_name]
    );

    await client.query('COMMIT');
    success(res, school, 'School created successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateSchool = async (req, res) => {
  const fields = ['name', 'phone', 'address', 'city', 'province', 'type', 'subscription_plan',
    'subscription_start', 'subscription_end', 'max_students', 'max_teachers', 'settings', 'logo_url', 'website', 'motto'];
  const updates = [];
  const params = [];

  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      params.push(req.body[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE schools SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
    params
  );
  success(res, rows[0]);
};

const updateSchoolStatus = async (req, res) => {
  const { status } = req.body;
  const { rows } = await pool.query(
    'UPDATE schools SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  success(res, rows[0]);
};

const deleteSchool = async (req, res) => {
  await pool.query('DELETE FROM schools WHERE id = $1', [req.params.id]);
  success(res, null, 'School deleted');
};

const deleteAllSchools = async (req, res) => {
  await pool.query('DELETE FROM schools');
  success(res, null, 'All schools deleted');
};

const clearSchoolData = async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tables = [
      'notifications', 'audit_logs', 'support_tickets', 'subscription_logs',
      'events', 'book_borrowings', 'books', 'portfolio_items', 'announcements',
      'messages', 'quiz_submissions', 'quiz_questions', 'quizzes',
      'assignment_submissions', 'assignments', 'lessons', 'courses',
      'report_cards', 'grade_scales', 'marks', 'assessments', 'attendance',
      'parent_student_links', 'student_profiles', 'teacher_subjects',
      'teacher_profiles', 'subjects', 'streams', 'classes', 'departments',
      'terms', 'academic_years', 'branches', 'users',
    ];
    for (const table of tables) {
      await client.query(`DELETE FROM ${table} WHERE school_id = $1`, [id]);
    }
    await client.query('COMMIT');
    success(res, null, 'School data cleared successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getSchoolStats = async (req, res) => {
  const id = req.params.id;
  const [students, teachers, parents, classes] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE school_id=$1 AND role='student'", [id]),
    pool.query("SELECT COUNT(*) FROM users WHERE school_id=$1 AND role='teacher'", [id]),
    pool.query("SELECT COUNT(*) FROM users WHERE school_id=$1 AND role='parent'", [id]),
    pool.query('SELECT COUNT(*) FROM classes WHERE school_id=$1', [id]),
  ]);
  success(res, {
    students: parseInt(students.rows[0].count),
    teachers: parseInt(teachers.rows[0].count),
    parents: parseInt(parents.rows[0].count),
    classes: parseInt(classes.rows[0].count),
  });
};

module.exports = { getAllSchools, getSchool, createSchool, updateSchool, updateSchoolStatus, deleteSchool, deleteAllSchools, getSchoolStats, clearSchoolData };
