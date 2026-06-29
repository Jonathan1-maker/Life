const router = require('express').Router();
const c = require('../controllers/assignment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(c.getAssignments));
router.post('/', authorize('teacher', 'school_admin'), asyncHandler(c.createAssignment));
router.post('/:id/submit', authorize('student'), asyncHandler(c.submitAssignment));
router.get('/:id/submissions', authorize('teacher', 'school_admin'), asyncHandler(c.getSubmissions));
router.patch('/:id/submissions/:subId/grade', authorize('teacher', 'school_admin'), asyncHandler(c.gradeSubmission));

module.exports = router;
