const pool = require('../config/database');
const { success } = require('../utils/response.utils');

// Basic AI responses using rule-based logic (replace with OpenAI/Gemini API in production)

const studyAssistant = async (req, res) => {
  const { question, subject } = req.body;
  // In production: call OpenAI/Gemini API
  success(res, {
    answer: `This is a placeholder AI response for your ${subject || 'general'} question: "${question}". In production, this connects to an AI model like GPT-4 or Gemini to provide detailed academic explanations.`,
    subject,
  });
};

const generateQuestions = async (req, res) => {
  const { notes, count = 5, type = 'mcq' } = req.body;
  // In production: send notes to AI API and parse response
  const mockQuestions = Array.from({ length: count }, (_, i) => ({
    question: `Sample ${type} question ${i + 1} generated from your notes`,
    question_type: type,
    options: type === 'mcq' ? ['Option A', 'Option B', 'Option C', 'Option D'] : null,
    correct_answer: type === 'mcq' ? 'Option A' : type === 'true_false' ? 'True' : 'Sample answer',
    marks: 1,
  }));
  success(res, { questions: mockQuestions });
};

const generateReportComment = async (req, res) => {
  const { student_id, term_id } = req.body;

  const { rows: [student] } = await pool.query('SELECT first_name, last_name FROM users WHERE id=$1', [student_id]);
  const { rows: [rc] } = await pool.query('SELECT average, attendance_percent FROM report_cards WHERE student_id=$1 AND term_id=$2', [student_id, term_id]);

  if (!rc) return res.status(404).json({ error: 'Report card not found' });

  const avg = parseFloat(rc.average || 0);
  let comment;
  if (avg >= 80) comment = `${student.first_name} has demonstrated exceptional academic performance this term, consistently showing dedication and mastery of the curriculum.`;
  else if (avg >= 65) comment = `${student.first_name} has shown good academic progress this term. With continued effort and focus, further improvement is achievable.`;
  else if (avg >= 50) comment = `${student.first_name} has performed satisfactorily this term. More consistent study habits and engagement with class activities will help improve results.`;
  else comment = `${student.first_name} requires significant academic support. We encourage additional study, teacher engagement, and parent involvement to help improve performance.`;

  // Save AI comment to report card
  await pool.query('UPDATE report_cards SET ai_comment=$1 WHERE student_id=$2 AND term_id=$3', [comment, student_id, term_id]);

  success(res, { comment });
};

const detectAtRiskStudents = async (req, res) => {
  const school_id = req.user.school_id;

  const { rows: lowPerformers } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, rc.average, 'low_performance' as risk_type
     FROM report_cards rc JOIN users u ON u.id=rc.student_id
     WHERE rc.school_id=$1 AND rc.average < 50 ORDER BY rc.average ASC LIMIT 20`,
    [school_id]
  );

  const { rows: poorAttendance } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name,
            ROUND(SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(a.id),0),1) as attendance_pct,
            'poor_attendance' as risk_type
     FROM users u JOIN attendance a ON a.user_id=u.id
     WHERE u.school_id=$1 AND u.role='student' AND a.date > NOW()-INTERVAL '30 days'
     GROUP BY u.id HAVING ROUND(SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(a.id),0),1) < 70
     LIMIT 20`,
    [school_id]
  );

  success(res, {
    low_performers: lowPerformers,
    poor_attendance: poorAttendance,
    total_at_risk: lowPerformers.length + poorAttendance.length,
  });
};

module.exports = { studyAssistant, generateQuestions, generateReportComment, detectAtRiskStudents };
