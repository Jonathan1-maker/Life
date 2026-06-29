const router = require('express').Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { success } = require('../utils/response.utils');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, ay.name as year_name FROM terms t
     LEFT JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE t.school_id=$1 ORDER BY t.start_date DESC`,
    [req.user.school_id]
  );
  success(res, rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, start_date, end_date, academic_year_id, is_current } = req.body;
  // Ensure academic_year_id is nullable (schema originally has NOT NULL)
  await pool.query(`ALTER TABLE terms ALTER COLUMN academic_year_id DROP NOT NULL`).catch(() => {});
  const { rows } = await pool.query(
    `INSERT INTO terms (school_id, academic_year_id, name, start_date, end_date, is_current)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.school_id, academic_year_id || null, name, start_date, end_date, is_current || false]
  );
  success(res, rows[0], 'Term created', 201);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM terms WHERE id=$1 AND school_id=$2', [req.params.id, req.user.school_id]);
  success(res, null, 'Term deleted');
}));

module.exports = router;
