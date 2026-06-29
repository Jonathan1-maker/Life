const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getGrade = (score, total) => {
  const pct = (score / total) * 100;
  if (pct >= 70) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'F';
};

const enterMarks = async (req, res) => {
  const { assessment_id, marks } = req.body;
  const { rows: [assessment] } = await pool.query('SELECT total_marks FROM assessments WHERE id=$1', [assessment_id]);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const m of marks) {
      const grade = getGrade(m.marks_obtained, assessment.total_marks);
      await client.query(
        `INSERT INTO marks (school_id, assessment_id, student_id, marks_obtained, grade, remarks, entered_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (assessment_id, student_id) DO UPDATE SET marks_obtained=$4, grade=$5, remarks=$6`,
        [req.user.school_id, assessment_id, m.student_id, m.marks_obtained, grade, m.remarks, req.user.id]
      );
    }
    await client.query('COMMIT');
    success(res, null, 'Marks saved');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getAssessmentMarks = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.first_name, u.last_name FROM marks m JOIN users u ON u.id=m.student_id
     WHERE m.assessment_id=$1 ORDER BY u.first_name`,
    [req.params.id]
  );
  success(res, rows);
};

const getStudentMarks = async (req, res) => {
  const { term_id } = req.query;
  const params = [req.params.id];
  let sql = `SELECT m.*, a.title, a.type, a.total_marks, s.name as subject_name
     FROM marks m JOIN assessments a ON a.id=m.assessment_id JOIN subjects s ON s.id=a.subject_id
     WHERE m.student_id=$1`;
  if (term_id) { params.push(term_id); sql += ` AND a.term_id=$2`; }
  sql += ` ORDER BY s.name`;
  const { rows } = await pool.query(sql, params);
  success(res, rows);
};

module.exports = { enterMarks, getAssessmentMarks, getStudentMarks };
