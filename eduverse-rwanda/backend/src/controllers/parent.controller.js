const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getParents = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
            COUNT(psl.student_id) as children_count
     FROM users u
     LEFT JOIN parent_student_links psl ON psl.parent_id = u.id
     WHERE u.school_id = $1 AND u.role = 'parent' GROUP BY u.id ORDER BY u.first_name`,
    [req.user.school_id]
  );
  success(res, rows);
};

const createParent = async (req, res) => {
  const { email, first_name, last_name, phone, gender, student_ids, relationship } = req.body;
  const school_id = req.user.school_id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hashed = await bcrypt.hash('Parent@123', 12);
    const { rows } = await client.query(
      `INSERT INTO users (school_id, email, password, role, first_name, last_name, phone, gender) VALUES ($1,$2,$3,'parent',$4,$5,$6,$7) RETURNING id`,
      [school_id, email, hashed, first_name, last_name, phone, gender]
    );
    const parentId = rows[0].id;
    if (student_ids?.length) {
      for (const sid of student_ids) {
        await client.query(
          `INSERT INTO parent_student_links (parent_id, student_id, relationship) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
          [parentId, sid, relationship]
        );
      }
    }
    await client.query('COMMIT');
    success(res, { id: parentId }, 'Parent created', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteParent = async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  success(res, null, 'Parent deleted');
};

const getParentChildren = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, sp.class_id, sp.admission_number, sp.status,
            c.name as class_name, psl.relationship
     FROM parent_student_links psl
     JOIN users u ON u.id = psl.student_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN classes c ON c.id = sp.class_id
     WHERE psl.parent_id = $1`,
    [req.params.id]
  );
  success(res, rows);
};

const linkChild = async (req, res) => {
  const { student_id, relationship } = req.body;
  await pool.query(
    `INSERT INTO parent_student_links (parent_id, student_id, relationship) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [req.params.id, student_id, relationship]
  );
  success(res, null, 'Child linked');
};

const unlinkChild = async (req, res) => {
  const { student_id } = req.body;
  await pool.query(
    `DELETE FROM parent_student_links WHERE parent_id=$1 AND student_id=$2`,
    [req.params.id, student_id]
  );
  success(res, null, 'Child unlinked');
};

module.exports = { getParents, createParent, deleteParent, getParentChildren, linkChild, unlinkChild };
