const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getPortfolio = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM portfolio_items WHERE student_id=$1 ORDER BY date DESC',
    [req.params.studentId]
  );
  success(res, rows);
};

const addPortfolioItem = async (req, res) => {
  const { type, title, description, file_url, date } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO portfolio_items (student_id, school_id, type, title, description, file_url, date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.studentId, req.user.school_id, type, title, description, file_url, date]
  );
  success(res, rows[0], 'Portfolio item added', 201);
};

const deletePortfolioItem = async (req, res) => {
  await pool.query('DELETE FROM portfolio_items WHERE id=$1', [req.params.id]);
  success(res, null, 'Deleted');
};

module.exports = { getPortfolio, addPortfolioItem, deletePortfolioItem };
