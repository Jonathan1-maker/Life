const router = require('express').Router();
const c = require('../controllers/conduct.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.post('/', authorize('teacher', 'school_admin'), asyncHandler(c.saveConductMarks));
router.get('/', asyncHandler(c.getConductMarks));

module.exports = router;
