const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { success, paginate } = require('../utils/response.utils');
const { sendEmail, welcomeEmail } = require('../utils/email.utils');

const getUsers = async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (page - 1) * limit;
  const schoolId = req.user.role === 'super_admin' ? req.query.school_id : req.user.school_id;

  const params = [];
  const where = ['is_active = true'];
  if (schoolId) { params.push(schoolId); where.push(`school_id = $${params.length}`); }
  if (role) { params.push(role); where.push(`role = $${params.length}`); }
  if (search) { params.push(`%${search}%`); where.push(`(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`); }

  const countRes = await pool.query(`SELECT COUNT(*) FROM users WHERE ${where.join(' AND ')}`, params);
  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT id, school_id, email, role, first_name, last_name, phone, avatar_url, gender, is_active, last_login, created_at
     FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  paginate(res, rows, parseInt(countRes.rows[0].count), page, limit);
};

const getUser = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, school_id, email, role, first_name, last_name, phone, avatar_url, gender, date_of_birth, address, is_active, last_login, created_at FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  success(res, rows[0]);
};

const createUser = async (req, res) => {
  const { email, password, role, first_name, last_name, phone, gender, date_of_birth } = req.body;
  const school_id = req.user.role === 'super_admin' ? req.body.school_id : req.user.school_id;

  const hashed = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (school_id, email, password, role, first_name, last_name, phone, gender, date_of_birth)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, school_id, email, role, first_name, last_name`,
    [school_id, email, hashed, role, first_name, last_name, phone, gender, date_of_birth]
  );

  try {
    const mail = welcomeEmail(`${first_name} ${last_name}`, email, password);
    await sendEmail({ to: email, ...mail });
  } catch (_) {}

  success(res, rows[0], 'User created', 201);
};

const updateUser = async (req, res) => {
  const { first_name, last_name, phone, gender, date_of_birth, address, avatar_url } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET first_name=$1, last_name=$2, phone=$3, gender=$4, date_of_birth=$5, address=$6, avatar_url=$7, updated_at=NOW()
     WHERE id=$8 RETURNING id, email, role, first_name, last_name, phone, avatar_url`,
    [first_name, last_name, phone, gender, date_of_birth, address, avatar_url, req.params.id]
  );
  success(res, rows[0]);
};

const deactivateUser = async (req, res) => {
  await pool.query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
  success(res, null, 'User deactivated');
};

const resetPassword = async (req, res) => {
  const { new_password } = req.body;
  const hashed = await bcrypt.hash(new_password, 12);
  await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hashed, req.params.id]);
  success(res, null, 'Password reset successfully');
};

module.exports = { getUsers, getUser, createUser, updateUser, deactivateUser, resetPassword };
