const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getSubscriptions = async (req, res) => {
  // Return all schools with their subscription info + latest payment log
  const { rows } = await pool.query(`
    SELECT
      s.id, s.name as school_name, s.email, s.status as school_status,
      s.subscription_plan as plan, s.subscription_start, s.subscription_end,
      CASE
        WHEN s.status = 'suspended' THEN 'suspended'
        WHEN s.subscription_end IS NULL THEN 'pending'
        WHEN s.subscription_end < NOW() THEN 'expired'
        WHEN s.subscription_end < NOW() + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
      END as sub_status,
      COALESCE(sl.amount, 0) as last_amount,
      sl.payment_method, sl.payment_reference, sl.created_at as last_payment_at,
      (SELECT COALESCE(SUM(amount),0) FROM subscription_logs WHERE school_id=s.id) as total_paid
    FROM schools s
    LEFT JOIN LATERAL (
      SELECT * FROM subscription_logs WHERE school_id=s.id ORDER BY created_at DESC LIMIT 1
    ) sl ON true
    ORDER BY s.created_at DESC
  `);

  const revenue_trend = await pool.query(`
    SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month,
           COALESCE(SUM(amount),0) as revenue
    FROM subscription_logs
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) DESC LIMIT 8
  `);

  const total_revenue = await pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM subscription_logs`);

  success(res, {
    subscriptions: rows,
    revenue_trend: revenue_trend.rows.reverse(),
    total_revenue: total_revenue.rows[0].total,
  });
};

const createSubscription = async (req, res) => {
  const { school_id, plan, amount, start_date, end_date, payment_method, payment_reference } = req.body;
  if (!school_id || !plan || !start_date || !end_date)
    return res.status(400).json({ success: false, message: 'school_id, plan, start_date, end_date are required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE schools SET subscription_plan=$1, subscription_start=$2, subscription_end=$3, status='active', updated_at=NOW() WHERE id=$4`,
      [plan, start_date, end_date, school_id]
    );
    const { rows } = await client.query(
      `INSERT INTO subscription_logs (school_id, plan, amount, start_date, end_date, payment_method, payment_reference)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [school_id, plan, amount || 0, start_date, end_date, payment_method || null, payment_reference || null]
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

const revokeSubscription = async (req, res) => {
  const { id } = req.params; // school_id
  await pool.query(`UPDATE schools SET status='suspended', updated_at=NOW() WHERE id=$1`, [id]);
  success(res, null, 'School access suspended');
};

const reinstateSubscription = async (req, res) => {
  const { id } = req.params; // school_id
  await pool.query(`UPDATE schools SET status='active', updated_at=NOW() WHERE id=$1`, [id]);
  success(res, null, 'School access reinstated');
};

module.exports = { getSubscriptions, createSubscription, revokeSubscription, reinstateSubscription };
