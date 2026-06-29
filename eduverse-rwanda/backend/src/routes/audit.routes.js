const router = require('express').Router();
const { getAuditLogs } = require('../controllers/misc.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate, authorize('super_admin', 'school_admin'));
router.get('/', asyncHandler(getAuditLogs));

module.exports = router;
