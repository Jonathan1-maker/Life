const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getClasses = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.first_name || ' ' || u.last_name as teacher_name,
            COUNT(sp.user_id) as student_count
     FROM classes c
     LEFT JOIN users u ON u.id = c.class_teacher_id
     LEFT JOIN student_profiles sp ON sp.class_id = c.id
     WHERE c.school_id = $1 GROUP BY c.id, u.first_name, u.last_name ORDER BY c.name`,
    [req.user.school_id]
  );
  success(res, rows);
};

const ensureLevelCol = async () => {
  await pool.query(`ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_level VARCHAR(20) DEFAULT 'ordinary'`).catch(() => {});
};

const createClass = async (req, res) => {
  await ensureLevelCol();
  const { name, level, school_level, class_teacher_id, academic_year_id } = req.body;
  const levelInt = level ? parseInt(String(level).replace(/[^0-9]/g, '')) || null : null;
  const { rows } = await pool.query(
    `INSERT INTO classes (school_id, name, level, school_level, class_teacher_id, academic_year_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.school_id, name, levelInt, school_level || 'ordinary', class_teacher_id || null, academic_year_id || null]
  );
  success(res, rows[0], 'Class created', 201);
};

const updateClass = async (req, res) => {
  await ensureLevelCol();
  const { name, level, school_level, class_teacher_id } = req.body;
  const levelInt = level ? parseInt(String(level).replace(/[^0-9]/g, '')) || null : null;
  const { rows } = await pool.query(
    `UPDATE classes SET name=$1, level=$2, school_level=$3, class_teacher_id=$4 WHERE id=$5 AND school_id=$6 RETURNING *`,
    [name, levelInt, school_level || 'ordinary', class_teacher_id || null, req.params.id, req.user.school_id]
  );
  success(res, rows[0]);
};

const deleteClass = async (req, res) => {
  await pool.query('DELETE FROM classes WHERE id=$1 AND school_id=$2', [req.params.id, req.user.school_id]);
  success(res, null, 'Class deleted');
};

const getStreams = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM streams WHERE class_id=$1', [req.params.id]);
  success(res, rows);
};

const createStream = async (req, res) => {
  const { name, capacity } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO streams (school_id, class_id, name, capacity) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.school_id, req.params.id, name, capacity]
  );
  success(res, rows[0], 'Stream created', 201);
};

module.exports = { getClasses, createClass, updateClass, deleteClass, getStreams, createStream };
