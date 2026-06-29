const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const markAttendance = async (req, res) => {
  const { records, class_id, subject_id, date } = req.body;
  const school_id = req.user.school_id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      await client.query(
        `INSERT INTO attendance (school_id, user_id, class_id, subject_id, date, status, marked_by, remarks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (user_id, date, class_id, subject_id) DO UPDATE SET status=$6, remarks=$8`,
        [school_id, r.user_id, class_id, subject_id, date, r.status, req.user.id, r.remarks]
      );
    }
    await client.query('COMMIT');
    success(res, null, 'Attendance marked');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getClassAttendance = async (req, res) => {
  const { class_id, date } = req.query;
  const { rows } = await pool.query(
    `SELECT a.*, u.first_name, u.last_name FROM attendance a
     JOIN users u ON u.id = a.user_id
     WHERE a.school_id=$1 AND a.class_id=$2 AND a.date=$3 ORDER BY u.first_name`,
    [req.user.school_id, class_id, date]
  );
  success(res, rows);
};

const getStudentAttendance = async (req, res) => {
  const { month, year } = req.query;
  const { rows } = await pool.query(
    `SELECT * FROM attendance WHERE user_id=$1 AND EXTRACT(MONTH FROM date)=$2 AND EXTRACT(YEAR FROM date)=$3 ORDER BY date`,
    [req.params.id, month, year]
  );
  const total = rows.length;
  const present = rows.filter(r => r.status === 'present').length;
  success(res, { records: rows, summary: { total, present, absent: total - present, percent: total ? ((present / total) * 100).toFixed(1) : 0 } });
};

const getAttendanceReport = async (req, res) => {
  const { class_id, start_date, end_date } = req.query;
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name,
            COUNT(a.id) as total_days,
            SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) as absent,
            ROUND(SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(a.id),0), 1) as percent
     FROM users u
     LEFT JOIN attendance a ON a.user_id = u.id AND a.date BETWEEN $2 AND $3
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.school_id=$1 AND sp.class_id=$4
     GROUP BY u.id ORDER BY u.first_name`,
    [req.user.school_id, start_date, end_date, class_id]
  );
  success(res, rows);
};

module.exports = { markAttendance, getClassAttendance, getStudentAttendance, getAttendanceReport };
