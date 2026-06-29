const pool = require('../config/database');
const { success } = require('../utils/response.utils');

const getCourses = async (req, res) => {
  const { class_id, subject_id } = req.query;
  const params = [req.user.school_id];
  const where = ['c.school_id=$1'];
  if (class_id) { params.push(class_id); where.push(`c.class_id=$${params.length}`); }
  if (subject_id) { params.push(subject_id); where.push(`c.subject_id=$${params.length}`); }
  if (req.user.role === 'teacher') { params.push(req.user.id); where.push(`c.teacher_id=$${params.length}`); }

  const { rows } = await pool.query(
    `SELECT c.*, s.name as subject_name, cl.name as class_name,
            u.first_name || ' ' || u.last_name as teacher_name,
            COUNT(l.id) as lesson_count
     FROM courses c JOIN subjects s ON s.id=c.subject_id JOIN classes cl ON cl.id=c.class_id
     JOIN users u ON u.id=c.teacher_id LEFT JOIN lessons l ON l.course_id=c.id
     WHERE ${where.join(' AND ')} GROUP BY c.id,s.name,cl.name,u.first_name,u.last_name ORDER BY c.created_at DESC`,
    params
  );
  success(res, rows);
};

const getCourse = async (req, res) => {
  const { rows: [course] } = await pool.query(
    `SELECT c.*, s.name as subject_name, cl.name as class_name, u.first_name || ' ' || u.last_name as teacher_name
     FROM courses c JOIN subjects s ON s.id=c.subject_id JOIN classes cl ON cl.id=c.class_id JOIN users u ON u.id=c.teacher_id
     WHERE c.id=$1`,
    [req.params.id]
  );
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const { rows: lessons } = await pool.query('SELECT * FROM lessons WHERE course_id=$1 ORDER BY order_index', [req.params.id]);
  success(res, { ...course, lessons });
};

const createCourse = async (req, res) => {
  const { subject_id, class_id, title, description, thumbnail_url } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO courses (school_id, subject_id, class_id, teacher_id, title, description, thumbnail_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.school_id, subject_id, class_id, req.user.id, title, description, thumbnail_url]
  );
  success(res, rows[0], 'Course created', 201);
};

const addLesson = async (req, res) => {
  const { title, content, resource_type, resource_url, order_index } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO lessons (course_id, school_id, title, content, resource_type, resource_url, order_index) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.params.id, req.user.school_id, title, content, resource_type, resource_url, order_index]
  );
  success(res, rows[0], 'Lesson added', 201);
};

const publishCourse = async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE courses SET is_published=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [req.body.is_published, req.params.id]
  );
  success(res, rows[0]);
};

module.exports = { getCourses, getCourse, createCourse, addLesson, publishCourse };
