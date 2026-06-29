const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS timetable_slots (
      id            SERIAL PRIMARY KEY,
      school_id     UUID NOT NULL,
      class_id      UUID NOT NULL,
      teacher_id    UUID NOT NULL,
      subject_id    UUID NOT NULL,
      day           VARCHAR(10) NOT NULL,
      period        INTEGER NOT NULL,
      created_at    TIMESTAMP DEFAULT NOW(),
      UNIQUE (school_id, class_id, day, period)
    )
  `);
};

// GET /timetable?class_id=...
const getTimetable = async (req, res) => {
  await ensureTable();
  const { class_id } = req.query;
  const school_id = req.user.school_id;
  const params = [school_id];
  let where = `t.school_id=$1`;
  if (class_id) { params.push(class_id); where += ` AND t.class_id=$${params.length}`; }

  const { rows } = await pool.query(
    `SELECT t.*, s.name as subject_name, c.name as class_name,
            u.first_name || ' ' || u.last_name as teacher_name
     FROM timetable_slots t
     JOIN subjects s ON s.id = t.subject_id
     JOIN classes c ON c.id = t.class_id
     JOIN users u ON u.id = t.teacher_id
     WHERE ${where}
     ORDER BY t.day, t.period`,
    params
  );
  success(res, rows);
};

// GET /timetable/mine  — teacher sees only their own slots
const getMyTimetable = async (req, res) => {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT t.*, s.name as subject_name, c.name as class_name,
            u.first_name || ' ' || u.last_name as teacher_name
     FROM timetable_slots t
     JOIN subjects s ON s.id = t.subject_id
     JOIN classes c ON c.id = t.class_id
     JOIN users u ON u.id = t.teacher_id
     WHERE t.teacher_id=$1
     ORDER BY t.day, t.period`,
    [req.user.id]
  );
  success(res, rows);
};

// PUT /timetable  — upsert a single cell; enforces teacher conflict
const upsertSlot = async (req, res) => {
  await ensureTable();
  const { class_id, teacher_id, subject_id, day, period } = req.body;
  const school_id = req.user.school_id;

  // Teacher conflict check — same teacher, same day, same period, different class
  const { rows: conflict } = await pool.query(
    `SELECT c.name as class_name FROM timetable_slots t
     JOIN classes c ON c.id = t.class_id
     WHERE t.school_id=$1 AND t.teacher_id=$2 AND t.day=$3 AND t.period=$4 AND t.class_id != $5`,
    [school_id, teacher_id, day, period, class_id]
  );
  if (conflict.length) {
    return res.status(409).json({
      error: `Teacher is already assigned to ${conflict[0].class_name} at this period on ${day}.`
    });
  }

  // If replacing an existing slot with a different teacher, notify the old teacher
  const { rows: existing } = await pool.query(
    `SELECT teacher_id FROM timetable_slots WHERE school_id=$1 AND class_id=$2 AND day=$3 AND period=$4`,
    [school_id, class_id, day, period]
  );
  if (existing.length && existing[0].teacher_id !== teacher_id) {
    const { rows: [subj] } = await pool.query('SELECT name FROM subjects WHERE id=$1', [subject_id]);
    await pool.query(
      `INSERT INTO notifications (user_id, school_id, title, message, type, link)
       VALUES ($1,$2,'Timetable Updated',$3,'info','/teacher/dashboard')`,
      [existing[0].teacher_id, school_id, `Your timetable has been updated for ${day} period ${period}.`]
    ).catch(() => {});
    await pool.query(
      `INSERT INTO notifications (user_id, school_id, title, message, type, link)
       VALUES ($1,$2,'Timetable Assigned',$3,'info','/teacher/dashboard')`,
      [teacher_id, school_id, `You have been assigned ${subj?.name || 'a subject'} on ${day} period ${period}.`]
    ).catch(() => {});
  } else if (!existing.length) {
    const { rows: [subj] } = await pool.query('SELECT name FROM subjects WHERE id=$1', [subject_id]);
    await pool.query(
      `INSERT INTO notifications (user_id, school_id, title, message, type, link)
       VALUES ($1,$2,'Timetable Assigned',$3,'info','/teacher/dashboard')`,
      [teacher_id, school_id, `You have been assigned ${subj?.name || 'a subject'} on ${day} period ${period}.`]
    ).catch(() => {});
  }

  const { rows } = await pool.query(
    `INSERT INTO timetable_slots (school_id, class_id, teacher_id, subject_id, day, period)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (school_id, class_id, day, period)
     DO UPDATE SET teacher_id=$3, subject_id=$4
     RETURNING *`,
    [school_id, class_id, teacher_id, subject_id, day, period]
  );
  success(res, rows[0], 'Slot saved');
};

// DELETE /timetable  — clear a cell
const deleteSlot = async (req, res) => {
  await ensureTable();
  const { class_id, day, period } = req.body;
  const school_id = req.user.school_id;

  // notify the teacher being removed
  const { rows: existing } = await pool.query(
    `SELECT teacher_id FROM timetable_slots WHERE school_id=$1 AND class_id=$2 AND day=$3 AND period=$4`,
    [school_id, class_id, day, period]
  );
  if (existing.length) {
    await pool.query(
      `INSERT INTO notifications (user_id, school_id, title, message, type, link)
       VALUES ($1,$2,'Timetable Updated',$3,'info','/teacher/dashboard')`,
      [existing[0].teacher_id, school_id, `A slot has been removed from your timetable on ${day} period ${period}.`]
    ).catch(() => {});
  }

  await pool.query(
    `DELETE FROM timetable_slots WHERE school_id=$1 AND class_id=$2 AND day=$3 AND period=$4`,
    [school_id, class_id, day, period]
  );
  success(res, null, 'Slot cleared');
};

module.exports = { getTimetable, getMyTimetable, upsertSlot, deleteSlot };
