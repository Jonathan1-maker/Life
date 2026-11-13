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

const replyTicket = async (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ success: false, message: 'Reply is required' });
  // Add admin_reply column if not exists (safe migration)
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_reply TEXT`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ`);
  const { rows } = await pool.query(
    `UPDATE support_tickets SET admin_reply=$1, replied_at=NOW(), status='in_progress', updated_at=NOW() WHERE id=$2 RETURNING *`,
    [reply, req.params.id]
  );
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
  const { from, to, search } = req.query;
  const conditions = [];
  const params = [];

  if (school_id) { params.push(school_id); conditions.push(`al.school_id=$${params.length}`); }
  if (from)      { params.push(from);      conditions.push(`al.created_at >= $${params.length}`); }
  if (to)        { params.push(to);        conditions.push(`al.created_at <= $${params.length}::date + interval '1 day'`); }
  if (search)    { params.push(`%${search}%`); conditions.push(`(al.action ILIKE $${params.length} OR al.resource ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT al.*, u.first_name || ' ' || u.last_name as user_name FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id ${where} ORDER BY al.created_at DESC LIMIT 500`,
    params
  );
  success(res, rows);
};

const exportAuditLogs = async (req, res) => {
  const school_id = req.user.role === 'super_admin' ? req.query.school_id : req.user.school_id;
  const { from, to } = req.query;
  const conditions = [];
  const params = [];

  if (school_id) { params.push(school_id); conditions.push(`al.school_id=$${params.length}`); }
  if (from)      { params.push(from);      conditions.push(`al.created_at >= $${params.length}`); }
  if (to)        { params.push(to);        conditions.push(`al.created_at <= $${params.length}::date + interval '1 day'`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT al.action, al.resource, al.resource_id, u.first_name || ' ' || u.last_name as user_name, al.ip_address, al.created_at
     FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id ${where} ORDER BY al.created_at DESC`,
    params
  );

  const header = 'Action,Resource,Resource ID,User,IP Address,Time';
  const csvRows = rows.map(r =>
    [r.action, r.resource, r.resource_id || '', r.user_name || '', r.ip_address || '', new Date(r.created_at).toISOString()]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  );
  const csv = [header, ...csvRows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
  res.send(csv);
};

module.exports = { getTickets, createTicket, updateTicketStatus, replyTicket, getNotifications, markAllRead, markOneRead, deleteNotification, clearNotifications, getAuditLogs, exportAuditLogs };
