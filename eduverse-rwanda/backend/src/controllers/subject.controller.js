const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getSubjects = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.*, d.name as department_name FROM subjects s LEFT JOIN departments d ON d.id = s.department_id WHERE s.school_id=$1 ORDER BY s.name`,
    [req.user.school_id]
  );
  success(res, rows);
};

const createSubject = async (req, res) => {
  const { name, code, description, department_id } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO subjects (school_id, name, code, description, department_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.school_id, name, code, description, department_id]
  );
  success(res, rows[0], 'Subject created', 201);
};

const updateSubject = async (req, res) => {
  const { name, code, description, department_id } = req.body;
  const { rows } = await pool.query(
    `UPDATE subjects SET name=$1, code=$2, description=$3, department_id=$4 WHERE id=$5 AND school_id=$6 RETURNING *`,
    [name, code, description, department_id, req.params.id, req.user.school_id]
  );
  success(res, rows[0]);
};

const deleteSubject = async (req, res) => {
  await pool.query('DELETE FROM subjects WHERE id=$1 AND school_id=$2', [req.params.id, req.user.school_id]);
  success(res, null, 'Subject deleted');
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
