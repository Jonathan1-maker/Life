const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getSubscriptions = async (req, res) => {
  const { rows } = await pool.query('SELECT sl.*, s.name as school_name FROM subscription_logs sl JOIN schools s ON s.id=sl.school_id ORDER BY sl.created_at DESC LIMIT 50');
  success(res, rows);
};

const createSubscription = async (req, res) => {
  const { school_id, plan, amount, start_date, end_date, payment_method, payment_reference } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE schools SET subscription_plan=$1, subscription_start=$2, subscription_end=$3, status=\'active\' WHERE id=$4', [plan, start_date, end_date, school_id]);
    const { rows } = await client.query(
      `INSERT INTO subscription_logs (school_id, plan, amount, start_date, end_date, payment_method, payment_reference) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [school_id, plan, amount, start_date, end_date, payment_method, payment_reference]
    );
    await client.query('COMMIT');
    success(res, rows[0], 'Subscription created', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getSubscriptions, createSubscription };
