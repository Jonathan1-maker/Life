const pool = require('../config/database');

const auditLog = (action, resource) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400 && req.user) {
      try {
        await pool.query(
          `INSERT INTO audit_logs (school_id, user_id, action, resource, resource_id, details, ip_address, user_agent)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            req.user.school_id || null,
            req.user.id,
            action,
            resource,
            req.params.id || null,
            JSON.stringify(req.body),
            req.ip,
            req.headers['user-agent'],
          ]
        );
      } catch (_) {}
    }
  });
  next();
};

module.exports = { auditLog };
