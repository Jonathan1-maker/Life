const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { redisClient } = require('../config/redis');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');
const { success } = require('../utils/response.utils');

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
  if (!rows[0]) return res.status(401).json({ success: false, message: 'Invalid email or password' });

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await pool.query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);

  delete user.password;
  delete user.refresh_token;

  // Build user object matching frontend expectations
  const userData = {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role,
    avatar: user.avatar_url,
    schoolId: user.school_id,
  };

  success(res, { token, refreshToken, user: userData });
};

const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });

  const decoded = verifyRefreshToken(token);
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [decoded.id, token]);

  if (!rows[0]) return res.status(401).json({ error: 'Invalid refresh token' });

  const accessToken = generateAccessToken(rows[0]);
  success(res, { accessToken });
};

const logout = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    await redisClient.setEx(`blacklist:${token}`, 60 * 60, '1');
  }
  await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
  success(res, null, 'Logged out successfully');
};

const getMe = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, school_id, email, role, first_name, last_name, phone, avatar_url, gender, is_active, last_login, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  success(res, rows[0]);
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(current_password, rows[0].password);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

  const hashed = await bcrypt.hash(new_password, 12);
  await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id]);
  success(res, null, 'Password changed successfully');
};

module.exports = { login, refreshToken, logout, getMe, changePassword };
