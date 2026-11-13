const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getAnnouncements = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.first_name || ' ' || u.last_name as created_by_name FROM announcements a
     JOIN users u ON u.id=a.created_by
     WHERE a.school_id=$1 AND ($2 = ANY(a.target_roles) OR array_length(a.target_roles, 1) IS NULL OR array_length(a.target_roles, 1) = 0)
     ORDER BY a.created_at DESC LIMIT 20`,
    [req.user.school_id, req.user.role]
  );
  success(res, rows);
};

const createAnnouncement = async (req, res) => {
  const { title, content, target_roles, target_class_id, priority, expires_at } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO announcements (school_id, created_by, title, content, target_roles, target_class_id, priority, expires_at)
     VALUES ($1,$2,$3,$4,$5::text[],$6,$7,$8) RETURNING *`,
    [req.user.school_id, req.user.id, title, content, target_roles || [], target_class_id || null, priority || 'normal', expires_at || null]
  );
  success(res, rows[0], 'Announcement created', 201);
};

const deleteAnnouncement = async (req, res) => {
  await pool.query('DELETE FROM announcements WHERE id=$1 AND school_id=$2', [req.params.id, req.user.school_id]);
  success(res, null, 'Deleted');
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
