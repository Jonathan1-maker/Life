const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getEvents = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.*, u.first_name || ' ' || u.last_name as created_by_name FROM events e
     JOIN users u ON u.id=e.created_by WHERE e.school_id=$1 ORDER BY e.start_date`,
    [req.user.school_id]
  );
  success(res, rows);
};

const createEvent = async (req, res) => {
  const { title, description, event_type, start_date, end_date, location } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO events (school_id, created_by, title, description, event_type, start_date, end_date, location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.school_id, req.user.id, title, description, event_type, start_date, end_date, location]
  );
  success(res, rows[0], 'Event created', 201);
};

const deleteEvent = async (req, res) => {
  await pool.query('DELETE FROM events WHERE id=$1 AND school_id=$2', [req.params.id, req.user.school_id]);
  success(res, null, 'Event deleted');
};

module.exports = { getEvents, createEvent, deleteEvent };
