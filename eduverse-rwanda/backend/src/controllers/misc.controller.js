const pool = require('../config/database');
const { success } = require('../utils/response.utils');

// Support
const getTickets = async (req, res) => {
  const where = req.user.role === 'super_admin' ? '' : 'WHERE user_id=$1';
  const params = req.user.role === 'super_admin' ? [] : [req.user.id];
  const { rows } = await pool.query(`SELECT st.*, u.first_name || ' ' || u.last_name as user_name FROM support_tickets st JOIN users u ON u.id=st.user_id ${where} ORDER BY st.created_at DESC`, params);
  success(res, rows);
};

const createTicket = async (req, res) => {
  const { subject, description, priority } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO support_tickets (school_id, user_id, subject, description, priority) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.school_id, req.user.id, subject, description, priority]
  );
  success(res, rows[0], 'Ticket created', 201);
};

const updateTicketStatus = async (req, res) => {
  const { rows } = await pool.query('UPDATE support_tickets SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
  success(res, rows[0]);
};

// Notifications
const getNotifications = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [req.user.id]);
  success(res, rows);
};

const markAllRead = async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
  success(res, null, 'All notifications marked as read');
};

const markOneRead = async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  success(res, null, 'Marked as read');
};

const deleteNotification = async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  success(res, null, 'Notification deleted');
};

const clearNotifications = async (req, res) => {
  await pool.query('DELETE FROM notifications WHERE user_id=$1', [req.user.id]);
  success(res, null, 'All notifications cleared');
};

// Audit logs
const getAuditLogs = async (req, res) => {
  const school_id = req.user.role === 'super_admin' ? req.query.school_id : req.user.school_id;
  const params = school_id ? [school_id] : [];
  const where = school_id ? 'WHERE al.school_id=$1' : '';
  const { rows } = await pool.query(
    `SELECT al.*, u.first_name || ' ' || u.last_name as user_name FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id ${where} ORDER BY al.created_at DESC LIMIT 100`,
    params
  );
  success(res, rows);
};

module.exports = { getTickets, createTicket, updateTicketStatus, getNotifications, markAllRead, markOneRead, deleteNotification, clearNotifications, getAuditLogs };
