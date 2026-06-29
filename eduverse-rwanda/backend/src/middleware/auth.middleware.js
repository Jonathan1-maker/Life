const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { redisClient } = require('../config/redis');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  // Check if token is blacklisted (skip if Redis not available)
  try {
    if (redisClient.isReady) {
      const blacklisted = await redisClient.get(`blacklist:${token}`);
      if (blacklisted) return res.status(401).json({ message: 'Token revoked' });
    }
  } catch {}

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, school_id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Ensure school_id matches or user is super_admin
const tenantGuard = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  const schoolId = req.params.schoolId || req.body.school_id || req.query.school_id;
  if (schoolId && schoolId !== req.user.school_id) {
    return res.status(403).json({ error: 'Cross-tenant access denied' });
  }
  next();
};

module.exports = { authenticate, authorize, tenantGuard };
