const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getAssignments = async (req, res) => {
  const { class_id, subject_id } = req.query;
  const params = [req.user.school_id];
  const where = ['a.school_id=$1'];
  if (class_id) { params.push(class_id); where.push(`a.class_id=$${params.length}`); }
  if (subject_id) { params.push(subject_id); where.push(`a.subject_id=$${params.length}`); }
  if (req.user.role === 'teacher') { params.push(req.user.id); where.push(`a.teacher_id=$${params.length}`); }

  const { rows } = await pool.query(
    `SELECT a.*, s.name as subject_name, c.name as class_name, u.first_name || ' ' || u.last_name as teacher_name
     FROM assignments a JOIN subjects s ON s.id=a.subject_id JOIN classes c ON c.id=a.class_id JOIN users u ON u.id=a.teacher_id
     WHERE ${where.join(' AND ')} ORDER BY a.due_date`,
    params
  );
  success(res, rows);
};

const createAssignment = async (req, res) => {
  const { course_id, class_id, subject_id, title, description, attachment_url, due_date, total_marks } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO assignments (school_id, course_id, class_id, subject_id, teacher_id, title, description, attachment_url, due_date, total_marks)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.school_id, course_id, class_id, subject_id, req.user.id, title, description, attachment_url, due_date, total_marks]
  );
  success(res, rows[0], 'Assignment created', 201);
};

const submitAssignment = async (req, res) => {
  const { content, file_url } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO assignment_submissions (school_id, assignment_id, student_id, content, file_url)
     VALUES ($1,$2,$3,$4,$5) ON CONFLICT (assignment_id, student_id) DO UPDATE SET content=$4, file_url=$5, submitted_at=NOW() RETURNING *`,
    [req.user.school_id, req.params.id, req.user.id, content, file_url]
  );
  success(res, rows[0], 'Assignment submitted');
};

const gradeSubmission = async (req, res) => {
  const { marks_obtained, feedback } = req.body;
  const { rows } = await pool.query(
    `UPDATE assignment_submissions SET marks_obtained=$1, feedback=$2, status='graded' WHERE id=$3 RETURNING *`,
    [marks_obtained, feedback, req.params.subId]
  );
  success(res, rows[0]);
};

const getSubmissions = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT asub.*, u.first_name, u.last_name FROM assignment_submissions asub
     JOIN users u ON u.id=asub.student_id WHERE asub.assignment_id=$1 ORDER BY asub.submitted_at`,
    [req.params.id]
  );
  success(res, rows);
};

module.exports = { getAssignments, createAssignment, submitAssignment, gradeSubmission, getSubmissions };
