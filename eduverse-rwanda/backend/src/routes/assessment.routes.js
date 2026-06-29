const router = require('express').Router();
const c = require('../controllers/assessment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(c.getAssessments));
router.post('/', authorize('teacher', 'school_admin'), asyncHandler(c.createAssessment));
router.delete('/:id', authorize('teacher', 'school_admin'), asyncHandler(c.deleteAssessment));

module.exports = router;
