const router = require('express').Router();
const c = require('../controllers/ai.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.post('/study-assistant', asyncHandler(c.studyAssistant));
router.post('/generate-questions', authorize('teacher', 'school_admin'), asyncHandler(c.generateQuestions));
router.post('/report-comment', authorize('teacher', 'school_admin'), asyncHandler(c.generateReportComment));
router.get('/at-risk', authorize('super_admin', 'school_admin', 'teacher'), asyncHandler(c.detectAtRiskStudents));

module.exports = router;
