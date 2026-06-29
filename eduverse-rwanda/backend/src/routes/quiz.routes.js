const router = require('express').Router();
const c = require('../controllers/quiz.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(c.getQuizzes));
router.post('/', authorize('teacher', 'school_admin'), asyncHandler(c.createQuiz));
router.get('/:id', asyncHandler(c.getQuiz));
router.post('/:id/submit', authorize('student'), asyncHandler(c.submitQuiz));

module.exports = router;
