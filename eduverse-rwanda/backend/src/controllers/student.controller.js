const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { success, paginate } = require('../utils/response.utils');

const getStudents = async (req, res) => {
  const { page = 1, limit = 50, class_id, search, status } = req.query;
  const school_id = req.user.school_id;
  if (!school_id) return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 50, pages: 0 } });
  const offset = (page - 1) * limit;

  const params = [school_id];
  const where = [`u.school_id = $1`, `u.role = 'student'`];
  if (class_id) { params.push(class_id); where.push(`sp.class_id = $${params.length}`); }
  if (status) { params.push(status); where.push(`sp.status = $${params.length}`); }
  if (search) { params.push(`%${search}%`); where.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR sp.admission_number ILIKE $${params.length})`); }

  const countSql = `SELECT COUNT(*) FROM users u LEFT JOIN student_profiles sp ON sp.user_id = u.id WHERE ${where.join(' AND ')}`;
  const countRes = await pool.query(countSql, params);

  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.gender,
            sp.admission_number, sp.class_id, sp.stream_id, sp.status, sp.admission_date,
            c.name as class_name, s.name as stream_name
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN classes c ON c.id = sp.class_id
     LEFT JOIN streams s ON s.id = sp.stream_id
     WHERE ${where.join(' AND ')}
     ORDER BY u.first_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  paginate(res, rows, parseInt(countRes.rows[0].count), page, limit);
};

const getStudent = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.gender, u.date_of_birth, u.address,
            sp.*, c.name as class_name, s.name as stream_name
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN classes c ON c.id = sp.class_id
     LEFT JOIN streams s ON s.id = sp.stream_id
     WHERE u.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Student not found' });
  success(res, rows[0]);
};

const generateAdmissionNumber = async (req, res) => {
  const school_id = req.user.school_id;
  const year = new Date().getFullYear();
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM student_profiles WHERE school_id = $1 AND admission_number LIKE $2`,
    [school_id, `ADM-${year}-%`]
  );
  const next = parseInt(rows[0].count) + 1;
  const admission_number = `ADM-${year}-${String(next).padStart(4, '0')}`;
  success(res, { admission_number });
};

const createStudent = async (req, res) => {
  const {
    email, password, first_name, last_name, phone, gender, date_of_birth,
    class_id, stream_id, admission_number, admission_date, blood_group,
    emergency_contact_name, emergency_contact_phone,
  } = req.body;
  const school_id = req.user.school_id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hashed = await bcrypt.hash(password || 'Student@123', 12);
    const { rows } = await client.query(
      `INSERT INTO users (school_id, email, password, role, first_name, last_name, phone, gender, date_of_birth)
       VALUES ($1,$2,$3,'student',$4,$5,$6,$7,$8) RETURNING id`,
      [school_id, email, hashed, first_name, last_name, phone, gender, date_of_birth]
    );
    const userId = rows[0].id;

    let admNum = admission_number;
    if (!admNum) {
      const year = new Date().getFullYear();
      const countRes = await client.query(
        `SELECT COUNT(*) FROM student_profiles WHERE school_id = $1 AND admission_number LIKE $2`,
        [school_id, `ADM-${year}-%`]
      );
      admNum = `ADM-${year}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0')}`;
    }

    await client.query(
      `INSERT INTO student_profiles (user_id, school_id, class_id, stream_id, admission_number, admission_date, blood_group, emergency_contact_name, emergency_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [userId, school_id, class_id || null, stream_id || null, admNum, admission_date || null, blood_group || null, emergency_contact_name || null, emergency_contact_phone || null]
    );
    await client.query('COMMIT');
    success(res, { id: userId, admission_number: admNum }, 'Student created', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateStudent = async (req, res) => {
  const { first_name, last_name, phone, gender, date_of_birth, address, class_id, stream_id, blood_group, status } = req.body;
  await pool.query(
    `UPDATE users SET first_name=$1, last_name=$2, phone=$3, gender=$4, date_of_birth=$5, address=$6, updated_at=NOW() WHERE id=$7`,
    [first_name, last_name, phone, gender, date_of_birth, address, req.params.id]
  );
  await pool.query(
    `UPDATE student_profiles SET class_id=$1, stream_id=$2, blood_group=$3, status=$4 WHERE user_id=$5`,
    [class_id, stream_id, blood_group, status, req.params.id]
  );
  success(res, null, 'Student updated');
};

const deleteStudent = async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  success(res, null, 'Student deleted');
};

const promoteStudent = async (req, res) => {
  const { new_class_id, new_stream_id } = req.body;
  await pool.query(
    'UPDATE student_profiles SET class_id=$1, stream_id=$2 WHERE user_id=$3',
    [new_class_id, new_stream_id, req.params.id]
  );
  success(res, null, 'Student promoted');
};

const getStudentParents = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, psl.relationship
     FROM parent_student_links psl
     JOIN users u ON u.id = psl.parent_id
     WHERE psl.student_id = $1`,
    [req.params.id]
  );
  success(res, rows);
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, promoteStudent, getStudentParents, generateAdmissionNumber };
