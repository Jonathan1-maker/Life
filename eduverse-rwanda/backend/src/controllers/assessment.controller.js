const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getAssessments = async (req, res) => {
  const { class_id, term_id, subject_id } = req.query;
  const params = [req.user.school_id];
  const where = ['a.school_id = $1'];
  if (class_id) { params.push(class_id); where.push(`a.class_id = $${params.length}`); }
  if (term_id) { params.push(term_id); where.push(`a.term_id = $${params.length}`); }
  if (subject_id) { params.push(subject_id); where.push(`a.subject_id = $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT a.*, s.name as subject_name, c.name as class_name, u.first_name || ' ' || u.last_name as created_by_name
     FROM assessments a JOIN subjects s ON s.id=a.subject_id JOIN classes c ON c.id=a.class_id JOIN users u ON u.id=a.created_by
     WHERE ${where.join(' AND ')} ORDER BY a.date DESC`,
    params
  );
  success(res, rows);
};

const createAssessment = async (req, res) => {
  const { subject_id, class_id, stream_id, term_id, title, type, total_marks, date } = req.body;
  // make term_id nullable if not already
  await pool.query(`ALTER TABLE assessments ALTER COLUMN term_id DROP NOT NULL`).catch(() => {});
  const { rows } = await pool.query(
    `INSERT INTO assessments (school_id, subject_id, class_id, stream_id, term_id, created_by, title, type, total_marks, date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.school_id, subject_id, class_id, stream_id || null, term_id || null, req.user.id, title, type || 'exam', total_marks, date || null]
  );
  success(res, rows[0], 'Assessment created', 201);
};

const deleteAssessment = async (req, res) => {
  await pool.query('DELETE FROM assessments WHERE id=$1 AND school_id=$2', [req.params.id, req.user.school_id]);
  success(res, null, 'Assessment deleted');
};

module.exports = { getAssessments, createAssessment, deleteAssessment };
