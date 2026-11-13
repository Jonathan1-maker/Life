const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { redisClient } = require('../config/redis');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');
const { success } = require('../utils/response.utils');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    if (!rows[0]) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // Block login if school is suspended
    if (user.school_id && user.role !== 'super_admin') {
      const schoolRes = await pool.query('SELECT status, name FROM schools WHERE id=$1', [user.school_id]);
      if (schoolRes.rows[0]?.status === 'suspended') {
        return res.status(403).json({ success: false, message: `Access for ${schoolRes.rows[0].name} has been suspended. Please contact support to renew your subscription.` });
      }
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await pool.query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);

    delete user.password;
    delete user.refresh_token;

    const userData = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url,
      schoolId: user.school_id,
    };

    success(res, { token, refreshToken, user: userData });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = verifyRefreshToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid refresh token' });

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [decoded.id, token]);
    if (!rows[0]) return res.status(401).json({ error: 'Invalid refresh token' });

    const accessToken = generateAccessToken(rows[0]);
    success(res, { accessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token && redisClient.isReady) {
      await redisClient.setEx(`blacklist:${token}`, 60 * 60, '1').catch(() => {});
    }
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, school_id, email, role, first_name, last_name, phone, avatar_url, gender, is_active, last_login, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password are required' });
    }
    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id]);
    success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refreshToken, logout, getMe, changePassword };
