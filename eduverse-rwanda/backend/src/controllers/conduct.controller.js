const pool = require('../config/database');
const { success } = require('../utils/response.utils');

// Ensure table exists
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conduct_marks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
      marks INTEGER NOT NULL DEFAULT 0,
      max_marks INTEGER NOT NULL DEFAULT 40,
      comment TEXT,
      entered_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_id, term_id)
    )
  `);
};

const saveConductMarks = async (req, res) => {
  await ensureTable();
  const { entries } = req.body; // [{ student_id, term_id, marks, comment }]
  const school_id = req.user.school_id;
  for (const e of entries) {
    await pool.query(
      `INSERT INTO conduct_marks (school_id, student_id, term_id, marks, comment, entered_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (student_id, term_id) DO UPDATE SET marks=$4, comment=$5, entered_by=$6`,
      [school_id, e.student_id, e.term_id, e.marks, e.comment || null, req.user.id]
    );
  }
  success(res, null, 'Conduct marks saved');
};

const getConductMarks = async (req, res) => {
  await ensureTable();
  const { class_id, term_id } = req.query;
  const school_id = req.user.school_id;
  const { rows } = await pool.query(
    `SELECT cm.*, u.first_name, u.last_name, sp.admission_number
     FROM conduct_marks cm
     JOIN users u ON u.id = cm.student_id
     JOIN student_profiles sp ON sp.user_id = cm.student_id
     WHERE cm.school_id=$1
       ${term_id ? 'AND cm.term_id=$2' : ''}
       ${class_id ? `AND sp.class_id=$${term_id ? 3 : 2}` : ''}
     ORDER BY u.first_name`,
    [school_id, ...(term_id ? [term_id] : []), ...(class_id ? [class_id] : [])]
  );
  success(res, rows);
};

module.exports = { saveConductMarks, getConductMarks, ensureTable };
