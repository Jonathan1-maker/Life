const pool = require('../config/database');
const { success } = require('../utils/response.utils');
const { ensureTable: ensureConductTable } = require('./conduct.controller');

const getGrade = (pct) => {
  if (pct >= 70) return { grade: 'A', points: 6 };
  if (pct >= 65) return { grade: 'B', points: 5 };
  if (pct >= 60) return { grade: 'C', points: 4 };
  if (pct >= 50) return { grade: 'D', points: 3 };
  if (pct >= 40) return { grade: 'E', points: 2 };
  if (pct >= 20) return { grade: 'S', points: 1 };
  return { grade: 'F', points: 0 };
};

const buildSubjects = (markRows) => {
  const map = {};
  for (const row of markRows) {
    if (!map[row.subject_id]) {
      map[row.subject_id] = { subject_name: row.subject_name, subject_id: row.subject_id, eu: 0, eu_max: 0, et: 0, et_max: 0 };
    }
    const s = map[row.subject_id];
    const obtained = parseFloat(row.marks_obtained || 0);
    const max = parseFloat(row.total_marks || 0);
    if (row.type === 'exam') { s.et += obtained; s.et_max += max; }
    else { s.eu += obtained; s.eu_max += max; }
  }
  return Object.values(map).map((s) => {
    const tot = s.eu + s.et;
    const tot_max = s.eu_max + s.et_max;
    const pct = tot_max ? (tot / tot_max) * 100 : 0;
    const { grade } = getGrade(pct);
    return { ...s, tot, tot_max, percent: pct.toFixed(1), grade };
  });
};

const buildTermReport = async (student_id, school_id, class_id, termRow) => {
  const { rows: markRows } = await pool.query(
    `SELECT s.name as subject_name, s.id as subject_id, a.type, a.total_marks, m.marks_obtained
     FROM marks m
     JOIN assessments a ON a.id = m.assessment_id
     JOIN subjects s ON s.id = a.subject_id
     WHERE m.student_id=$1 AND a.school_id=$2 AND a.term_id=$3
     ORDER BY s.name`,
    [student_id, school_id, termRow.id]
  );

  const subjects = buildSubjects(markRows);
  const grand_total = subjects.reduce((a, s) => a + s.tot, 0);
  const grand_max   = subjects.reduce((a, s) => a + s.tot_max, 0);
  const grand_eu_total = subjects.reduce((a, s) => a + s.eu, 0);
  const grand_eu_max   = subjects.reduce((a, s) => a + s.eu_max, 0);
  const grand_et_total = subjects.reduce((a, s) => a + s.et, 0);
  const grand_et_max   = subjects.reduce((a, s) => a + s.et_max, 0);
  const grand_percent  = grand_max ? ((grand_total / grand_max) * 100).toFixed(1) : null;
  const { grade: final_grade } = grand_percent ? getGrade(parseFloat(grand_percent)) : { grade: null };

  const { rows: classStudents } = await pool.query(
    `SELECT m.student_id, SUM(m.marks_obtained) as total FROM marks m
     JOIN assessments a ON a.id = m.assessment_id
     WHERE a.class_id=$1 AND a.term_id=$2
     GROUP BY m.student_id ORDER BY total DESC`,
    [class_id, termRow.id]
  );
  const rank = classStudents.findIndex(s => s.student_id === student_id) + 1 || null;

  // Conduct
  const { rows: [conduct] } = await pool.query(
    `SELECT marks, max_marks, comment FROM conduct_marks WHERE student_id=$1 AND term_id=$2`,
    [student_id, termRow.id]
  ).catch(() => ({ rows: [null] }));

  return {
    term: termRow,
    subjects,                          // empty array = no marks this term
    has_marks: subjects.length > 0,
    grand_total: grand_total.toFixed(1), grand_max,
    grand_eu_total: grand_eu_total.toFixed(1), grand_eu_max,
    grand_et_total: grand_et_total.toFixed(1), grand_et_max,
    grand_percent,   // null if no marks
    final_grade,     // null if no marks
    rank: subjects.length ? rank : null,
    class_size: classStudents.length,
    conduct: conduct || null,
  };
};

const generateReportCard = async (req, res) => {
  const { student_id, year_id } = req.body;
  const school_id = req.user.school_id;

  const { rows: terms } = await pool.query(
    `SELECT id FROM terms WHERE academic_year_id=$1 AND school_id=$2 ORDER BY start_date`,
    [year_id, school_id]
  );

  const { rows: [sp] } = await pool.query('SELECT class_id FROM student_profiles WHERE user_id=$1', [student_id]);

  for (const t of terms) {
    const { rows: marks } = await pool.query(
      `SELECT m.marks_obtained, a.total_marks FROM marks m
       JOIN assessments a ON a.id=m.assessment_id
       WHERE m.student_id=$1 AND a.term_id=$2`,
      [student_id, t.id]
    );
    if (!marks.length) continue; // skip terms with no marks
    const totalObtained = marks.reduce((s, m) => s + parseFloat(m.marks_obtained || 0), 0);
    const totalMax = marks.reduce((s, m) => s + parseFloat(m.total_marks || 0), 0);
    const average = totalMax ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;

    const { rows: [existing] } = await pool.query(
      'SELECT id FROM report_cards WHERE student_id=$1 AND term_id=$2', [student_id, t.id]
    );
    if (existing) {
      await pool.query(`UPDATE report_cards SET total_marks=$1, average=$2 WHERE id=$3`, [totalObtained, average, existing.id]);
    } else {
      await pool.query(
        `INSERT INTO report_cards (school_id, student_id, term_id, class_id, total_marks, average) VALUES ($1,$2,$3,$4,$5,$6)`,
        [school_id, student_id, t.id, sp?.class_id, totalObtained, average]
      );
    }
  }

  success(res, {}, 'Report card generated');
};

const getReportCard = async (req, res) => {
  const { student_id, year_id } = req.query;

  await ensureConductTable().catch(() => {});

  const { rows: [student] } = await pool.query(
    `SELECT u.first_name, u.last_name, u.gender,
            sp.admission_number, sp.class_id,
            c.name as class_name,
            COALESCE(c.school_level, 'ordinary') as school_level,
            sc.name as school_name, sc.address as school_address, sc.email as school_email,
            sc.phone as school_phone, sc.city as school_city, sc.province as school_province,
            sc.motto as school_motto, u.school_id
     FROM users u
     JOIN student_profiles sp ON sp.user_id = u.id
     JOIN classes c ON c.id = sp.class_id
     JOIN schools sc ON sc.id = u.school_id
     WHERE u.id = $1`,
    [student_id]
  );
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const { rows: [hm] } = await pool.query(
    `SELECT first_name, last_name FROM users WHERE school_id=$1 AND role='school_admin' LIMIT 1`,
    [student.school_id]
  );

  const { rows: [ay] } = await pool.query(`SELECT name FROM academic_years WHERE id=$1`, [year_id]);
  const academicYearName = ay?.name;

  // Always return ALL terms for the year (with blank subjects for terms with no marks)
  const { rows: terms } = await pool.query(
    `SELECT t.*, ay.name as year_name FROM terms t
     LEFT JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE t.academic_year_id=$1 AND t.school_id=$2 ORDER BY t.start_date`,
    [year_id, student.school_id]
  );

  // Ensure we have exactly 3 term slots (Term 1, 2, 3) — pad with empty placeholders
  const termSlots = ['1', '2', '3'].map(n => {
    return terms.find(t => String(t.name) === n) || { id: null, name: n, year_name: academicYearName, _empty: true };
  });

  const term_reports = [];
  const allMarkRows = [];

  for (const t of termSlots) {
    // Empty placeholder term — no marks exist
    if (t._empty || !t.id) {
      term_reports.push({
        term: t, subjects: [], has_marks: false,
        grand_total: '0', grand_max: 0,
        grand_eu_total: '0', grand_eu_max: 0,
        grand_et_total: '0', grand_et_max: 0,
        grand_percent: null, final_grade: null,
        rank: null, class_size: 0, conduct: null,
      });
      continue;
    }
    const tr = await buildTermReport(student_id, student.school_id, student.class_id, t);
    term_reports.push(tr);
    if (tr.has_marks) {
      const { rows: markRows } = await pool.query(
        `SELECT s.name as subject_name, s.id as subject_id, a.type, a.total_marks, m.marks_obtained
         FROM marks m
         JOIN assessments a ON a.id = m.assessment_id
         JOIN subjects s ON s.id = a.subject_id
         WHERE m.student_id=$1 AND a.school_id=$2 AND a.term_id=$3`,
        [student_id, student.school_id, t.id]
      );
      allMarkRows.push(...markRows);
    }
  }

  // Annual combined (only subjects that have marks in at least one term)
  const annualMap = {};
  for (const row of allMarkRows) {
    if (!annualMap[row.subject_id]) {
      annualMap[row.subject_id] = { subject_name: row.subject_name, subject_id: row.subject_id, eu: 0, eu_max: 0, et: 0, et_max: 0 };
    }
    const s = annualMap[row.subject_id];
    const obtained = parseFloat(row.marks_obtained || 0);
    const max = parseFloat(row.total_marks || 0);
    if (row.type === 'exam') { s.et += obtained; s.et_max += max; }
    else { s.eu += obtained; s.eu_max += max; }
  }
  const combined_subjects = Object.values(annualMap).map(s => {
    const tot = s.eu + s.et;
    const tot_max = s.eu_max + s.et_max;
    const pct = tot_max ? (tot / tot_max) * 100 : 0;
    const { grade } = getGrade(pct);
    return { ...s, tot, tot_max, percent: pct.toFixed(1), grade };
  });

  const combined_total = combined_subjects.reduce((a, s) => a + s.tot, 0);
  const combined_max   = combined_subjects.reduce((a, s) => a + s.tot_max, 0);
  const combined_percent = combined_max ? ((combined_total / combined_max) * 100).toFixed(1) : '0.0';
  const { grade: combined_grade } = getGrade(parseFloat(combined_percent));

  const { rows: classStudents } = await pool.query(
    `SELECT m.student_id, SUM(m.marks_obtained) as total FROM marks m
     JOIN assessments a ON a.id = m.assessment_id
     JOIN terms t ON t.id = a.term_id
     WHERE a.class_id=$1 AND t.academic_year_id=$2
     GROUP BY m.student_id ORDER BY total DESC`,
    [student.class_id, year_id]
  );
  const combined_rank = classStudents.findIndex(s => s.student_id === student_id) + 1 || null;

  return success(res, {
    student, headmaster: hm, academic_year: academicYearName,
    mode: 'all_terms',
    term_reports,
    combined_subjects,
    combined_total: combined_total.toFixed(1), combined_max,
    combined_percent, combined_grade,
    combined_rank, class_size: classStudents.length,
  });
};

const getStudentList = async (req, res) => {
  const { class_id } = req.query;
  const school_id = req.user.school_id;
  const params = [school_id];
  let where = `u.school_id=$1 AND u.role='student'`;
  if (class_id) { params.push(class_id); where += ` AND sp.class_id=$${params.length}`; }
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, sp.admission_number, c.name as class_name
     FROM users u JOIN student_profiles sp ON sp.user_id=u.id LEFT JOIN classes c ON c.id=sp.class_id
     WHERE ${where} ORDER BY u.first_name`,
    params
  );
  success(res, rows);
};

module.exports = { generateReportCard, getReportCard, getStudentList };
