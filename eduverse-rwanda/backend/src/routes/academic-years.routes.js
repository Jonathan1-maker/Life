const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { success } = require('../utils/response.utils');

router.use(authenticate);

// Ensure table exists (create if not already present via schema)
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS academic_years (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      start_date DATE,
      end_date DATE,
      is_current BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {});
  // Make start_date/end_date nullable if table already exists with NOT NULL
  await pool.query(`ALTER TABLE academic_years ALTER COLUMN start_date DROP NOT NULL`).catch(() => {});
  await pool.query(`ALTER TABLE academic_years ALTER COLUMN end_date DROP NOT NULL`).catch(() => {});
};

router.get('/', asyncHandler(async (req, res) => {
  await ensureTable();
  const { rows } = await pool.query(
    `SELECT * FROM academic_years WHERE school_id=$1 ORDER BY created_at DESC`,
    [req.user.school_id]
  );
  success(res, rows);
}));

router.post('/', authorize('school_admin'), asyncHandler(async (req, res) => {
  await ensureTable();
  const { name, start_date, end_date } = req.body;
  // Allow nullable dates in case schema differs
  const { rows } = await pool.query(
    `INSERT INTO academic_years (school_id, name, start_date, end_date)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.school_id, name, start_date || null, end_date || null]
  ).catch(() =>
    // Fallback: schema may not have start_date/end_date columns yet
    pool.query(
      `INSERT INTO academic_years (school_id, name) VALUES ($1,$2) RETURNING *`,
      [req.user.school_id, name]
    )
  );
  success(res, rows[0], 'Academic year created', 201);
}));

router.delete('/:id', authorize('school_admin'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM academic_years WHERE id=$1 AND school_id=$2', [req.params.id, req.user.school_id]);
  success(res, null, 'Academic year deleted');
}));

module.exports = router;
