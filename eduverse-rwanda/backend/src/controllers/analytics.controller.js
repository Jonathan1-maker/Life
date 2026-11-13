const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getPublicStats = async (req, res) => {
  const [schools, students, teachers] = await Promise.all([
    pool.query("SELECT COUNT(*) as total FROM schools WHERE status='active'"),
    pool.query("SELECT COUNT(*) as total FROM users WHERE role='student'"),
    pool.query("SELECT COUNT(*) as total FROM users WHERE role='teacher'"),
  ]);
  success(res, {
    totalSchools: parseInt(schools.rows[0].total),
    totalStudents: parseInt(students.rows[0].total),
    totalTeachers: parseInt(teachers.rows[0].total),
  });
};

const getPlatformAnalytics = async (req, res) => {
  const [schools, students, teachers, parents, activeUsers, revenue] = await Promise.all([
    pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN status='active' THEN 1 END) as active, COUNT(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) THEN 1 END) as this_month FROM schools"),
    pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) THEN 1 END) as this_month FROM users WHERE role='student'"),
    pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) THEN 1 END) as this_month FROM users WHERE role='teacher'"),
    pool.query("SELECT COUNT(*) FROM users WHERE role='parent'"),
    pool.query("SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '30 days'"),
    pool.query("SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(CASE WHEN DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) THEN amount END),0) as this_month FROM subscription_logs"),
  ]);

  const schoolsByPlan = await pool.query(
    "SELECT subscription_plan as plan, COUNT(*) as count FROM schools GROUP BY subscription_plan"
  );

  const topSchools = await pool.query(
    `SELECT s.name, s.id,
            COUNT(DISTINCT u.id) as student_count,
            ROUND(AVG(rc.average),1) as avg_performance
     FROM schools s
     LEFT JOIN users u ON u.school_id=s.id AND u.role='student'
     LEFT JOIN report_cards rc ON rc.school_id=s.id
     GROUP BY s.id ORDER BY avg_performance DESC NULLS LAST LIMIT 5`
  );

  const recentActivities = await pool.query(
    `SELECT al.*, u.first_name || ' ' || u.last_name as user_name, s.name as school_name
     FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id LEFT JOIN schools s ON s.id=al.school_id
     ORDER BY al.created_at DESC LIMIT 10`
  );

  const schoolsByDistrict = await pool.query(
    "SELECT city as district, COUNT(*) as schools FROM schools GROUP BY city ORDER BY schools DESC"
  );

  const enrollmentTrend = await pool.query(
    `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month, COUNT(*) as students
     FROM users WHERE role='student' GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY DATE_TRUNC('month', created_at) DESC LIMIT 7`
  );

  const unreadMessages = await pool.query(
    "SELECT COUNT(*) FROM messages WHERE is_read = false"
  );

  success(res, {
    schools: schools.rows[0],
    students: students.rows[0],
    teachers: teachers.rows[0],
    parents: parseInt(parents.rows[0].count),
    active_users: parseInt(activeUsers.rows[0].count),
    revenue: revenue.rows[0],
    schools_by_plan: schoolsByPlan.rows,
    schools_by_district: schoolsByDistrict.rows,
    enrollment_trend: enrollmentTrend.rows.reverse(),
    top_schools: topSchools.rows,
    recent_activities: recentActivities.rows,
    unread_messages: parseInt(unreadMessages.rows[0].count),
  });
};

const getSchoolAnalytics = async (req, res) => {
  const school_id = req.user.school_id;

  const [students, teachers, classes, attendance, avgPerformance] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE school_id=$1 AND role='student'", [school_id]),
    pool.query("SELECT COUNT(*) FROM users WHERE school_id=$1 AND role='teacher'", [school_id]),
    pool.query('SELECT COUNT(*) FROM classes WHERE school_id=$1', [school_id]),
    pool.query(
      `SELECT ROUND(AVG(CASE WHEN status='present' THEN 100 ELSE 0 END),1) as percent FROM attendance WHERE school_id=$1 AND date > NOW()-INTERVAL '30 days'`,
      [school_id]
    ),
    pool.query('SELECT ROUND(AVG(average),1) as avg FROM report_cards WHERE school_id=$1', [school_id]),
  ]);

  const performanceTrend = await pool.query(
    `SELECT DATE_TRUNC('week', rc.generated_at) as week, ROUND(AVG(rc.average),1) as avg
     FROM report_cards rc WHERE rc.school_id=$1 GROUP BY week ORDER BY week LIMIT 8`,
    [school_id]
  );

  const subjectPerformance = await pool.query(
    `SELECT s.name as subject, ROUND(AVG(m.marks_obtained * 100 / NULLIF(a.total_marks,0)),1) as avg_score
     FROM marks m JOIN assessments a ON a.id=m.assessment_id JOIN subjects s ON s.id=a.subject_id
     WHERE a.school_id=$1 GROUP BY s.name ORDER BY avg_score DESC LIMIT 8`,
    [school_id]
  );

  success(res, {
    students: parseInt(students.rows[0].count),
    teachers: parseInt(teachers.rows[0].count),
    classes: parseInt(classes.rows[0].count),
    attendance_percent: parseFloat(attendance.rows[0].percent || 0),
    avg_performance: parseFloat(avgPerformance.rows[0].avg || 0),
    performance_trend: performanceTrend.rows,
    subject_performance: subjectPerformance.rows,
  });
};

const getCustomReport = async (req, res) => {
  const { startDate, endDate, metric } = req.body;
  const from = startDate || '2000-01-01';
  const to   = endDate   || new Date().toISOString().split('T')[0];

  let data = {};

  if (!metric || metric === 'enrollments') {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month, COUNT(*) as students
       FROM users WHERE role='student' AND created_at BETWEEN $1 AND $2::date + interval '1 day'
       GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)`,
      [from, to]
    );
    data.enrollments = rows;
  }

  if (!metric || metric === 'schools') {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month, COUNT(*) as schools
       FROM schools WHERE created_at BETWEEN $1 AND $2::date + interval '1 day'
       GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)`,
      [from, to]
    );
    data.schools = rows;
  }

  if (!metric || metric === 'activity') {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as day, COUNT(*) as actions
       FROM audit_logs WHERE created_at BETWEEN $1 AND $2::date + interval '1 day'
       GROUP BY DATE_TRUNC('day', created_at) ORDER BY DATE_TRUNC('day', created_at)`,
      [from, to]
    );
    data.activity = rows;
  }

  if (!metric || metric === 'performance') {
    const { rows } = await pool.query(
      `SELECT s.name as school, ROUND(AVG(rc.average),1) as avg_score, COUNT(rc.id) as report_cards
       FROM report_cards rc JOIN schools s ON s.id=rc.school_id
       WHERE rc.generated_at BETWEEN $1 AND $2::date + interval '1 day'
       GROUP BY s.name ORDER BY avg_score DESC LIMIT 20`,
      [from, to]
    );
    data.performance = rows;
  }

  // summary counts
  const [newStudents, newSchools, auditCount] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM users WHERE role='student' AND created_at BETWEEN $1 AND $2::date + interval '1 day'`, [from, to]),
    pool.query(`SELECT COUNT(*) FROM schools WHERE created_at BETWEEN $1 AND $2::date + interval '1 day'`, [from, to]),
    pool.query(`SELECT COUNT(*) FROM audit_logs WHERE created_at BETWEEN $1 AND $2::date + interval '1 day'`, [from, to]),
  ]);

  data.summary = {
    newStudents: parseInt(newStudents.rows[0].count),
    newSchools:  parseInt(newSchools.rows[0].count),
    totalActions: parseInt(auditCount.rows[0].count),
    from, to,
  };

  success(res, data);
};

module.exports = { getPublicStats, getPlatformAnalytics, getSchoolAnalytics, getCustomReport };
