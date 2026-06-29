const router = require('express').Router();
const c = require('../controllers/marks.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.post('/', authorize('teacher', 'school_admin'), asyncHandler(c.enterMarks));
router.get('/assessment/:id', asyncHandler(c.getAssessmentMarks));
router.get('/student/:id', asyncHandler(c.getStudentMarks));

module.exports = router;
