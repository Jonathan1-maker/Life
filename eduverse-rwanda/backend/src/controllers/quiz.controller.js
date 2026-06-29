const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getQuizzes = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT q.*, s.name as subject_name, c.name as class_name FROM quizzes q
     JOIN subjects s ON s.id=q.subject_id JOIN classes c ON c.id=q.class_id
     WHERE q.school_id=$1 ORDER BY q.created_at DESC`,
    [req.user.school_id]
  );
  success(res, rows);
};

const createQuiz = async (req, res) => {
  const { class_id, subject_id, title, description, duration_minutes, start_time, end_time, questions } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO quizzes (school_id, class_id, subject_id, teacher_id, title, description, duration_minutes, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.school_id, class_id, subject_id, req.user.id, title, description, duration_minutes, start_time, end_time]
    );
    const quizId = rows[0].id;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await client.query(
        `INSERT INTO quiz_questions (quiz_id, question, question_type, options, correct_answer, marks, order_index) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [quizId, q.question, q.question_type, JSON.stringify(q.options), q.correct_answer, q.marks || 1, i]
      );
    }
    await client.query('COMMIT');
    success(res, rows[0], 'Quiz created', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getQuiz = async (req, res) => {
  const { rows: [quiz] } = await pool.query('SELECT * FROM quizzes WHERE id=$1', [req.params.id]);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  const { rows: questions } = await pool.query(
    'SELECT * FROM quiz_questions WHERE quiz_id=$1 ORDER BY order_index',
    [req.params.id]
  );
  success(res, { ...quiz, questions });
};

const submitQuiz = async (req, res) => {
  const { answers } = req.body;
  const { rows: questions } = await pool.query('SELECT * FROM quiz_questions WHERE quiz_id=$1', [req.params.id]);
  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct_answer) score += parseFloat(q.marks);
  }
  const { rows } = await pool.query(
    `INSERT INTO quiz_submissions (quiz_id, student_id, answers, score) VALUES ($1,$2,$3,$4)
     ON CONFLICT (quiz_id, student_id) DO UPDATE SET answers=$3, score=$4 RETURNING *`,
    [req.params.id, req.user.id, JSON.stringify(answers), score]
  );
  success(res, { score, submission: rows[0] });
};

module.exports = { getQuizzes, createQuiz, getQuiz, submitQuiz };
