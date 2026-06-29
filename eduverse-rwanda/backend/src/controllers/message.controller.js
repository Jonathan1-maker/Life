const pool = require('../config/database');
const { success } = require('../utils/response.utils');

// get all messages between current user and another user (conversation thread)
const getConversation = async (req, res) => {
  const { with: otherId } = req.query;
  const { rows } = await pool.query(
    `SELECT m.*, u.first_name || ' ' || u.last_name as sender_name
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE (m.sender_id=$1 AND m.receiver_id=$2)
        OR (m.sender_id=$2 AND m.receiver_id=$1)
     ORDER BY m.created_at ASC`,
    [req.user.id, otherId]
  );
  // mark received messages as read
  await pool.query(
    `UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2 AND is_read=false`,
    [otherId, req.user.id]
  );
  success(res, rows);
};

// get list of distinct conversations (last message per partner)
const getConversations = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (partner_id)
       partner_id,
       partner_name,
       partner_role,
       body as last_message,
       created_at,
       unread_count
     FROM (
       SELECT
         CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END as partner_id,
         u.first_name || ' ' || u.last_name as partner_name,
         u.role as partner_role,
         m.body,
         m.created_at,
         (SELECT COUNT(*) FROM messages WHERE sender_id != $1 AND receiver_id=$1
           AND sender_id = CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
           AND is_read=false) as unread_count
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id=$1 THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id=$1 OR m.receiver_id=$1
       ORDER BY m.created_at DESC
     ) sub
     ORDER BY partner_id, created_at DESC`,
    [req.user.id]
  );
  success(res, rows);
};

// get super admin user to DM
const getSuperAdmin = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, first_name || ' ' || last_name as name, email FROM users WHERE role='super_admin' LIMIT 1`
  );
  success(res, rows[0] || null);
};

const getInbox = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.*, u.first_name || ' ' || u.last_name as sender_name, u.avatar_url as sender_avatar
     FROM messages m JOIN users u ON u.id=m.sender_id
     WHERE m.receiver_id=$1 ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  success(res, rows);
};

const sendMessage = async (req, res) => {
  const { receiver_id, subject, body, parent_id } = req.body;
  await pool.query(`ALTER TABLE messages ALTER COLUMN school_id DROP NOT NULL`).catch(() => {});
  const { rows } = await pool.query(
    `INSERT INTO messages (school_id, sender_id, receiver_id, subject, body, parent_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.school_id || null, req.user.id, receiver_id, subject, body, parent_id || null]
  );
  // push notification to receiver
  const senderName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Someone';
  const { rows: [receiver] } = await pool.query('SELECT role FROM users WHERE id=$1', [receiver_id]);
  const rolePathMap = {
    super_admin: '/super-admin/messages',
    school_admin: '/school-admin/messages',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
    parent: '/parent/messages',
  };
  const link = rolePathMap[receiver?.role] || '/messages';
  await pool.query(
    `INSERT INTO notifications (user_id, school_id, title, message, type, link)
     VALUES ($1,$2,$3,$4,'message',$5)`,
    [receiver_id, req.user.school_id || null, `New message from ${senderName}`, body.substring(0, 80), link]
  ).catch(() => {});
  success(res, rows[0], 'Message sent', 201);
};

const deleteMessage = async (req, res) => {
  await pool.query(
    `DELETE FROM messages WHERE id=$1 AND (sender_id=$2 OR receiver_id=$2)`,
    [req.params.id, req.user.id]
  );
  success(res, null, 'Message deleted');
};

const markRead = async (req, res) => {
  await pool.query('UPDATE messages SET is_read=true WHERE id=$1 AND receiver_id=$2', [req.params.id, req.user.id]);
  success(res, null, 'Marked as read');
};

const getUnreadCount = async (req, res) => {
  const { rows } = await pool.query('SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND is_read=false', [req.user.id]);
  success(res, { count: parseInt(rows[0].count) });
};

module.exports = { getInbox, getConversation, getConversations, getSuperAdmin, sendMessage, deleteMessage, markRead, getUnreadCount };
