const router = require('express').Router();
const c = require('../controllers/reportcard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.post('/generate', authorize('teacher', 'school_admin'), asyncHandler(c.generateReportCard));
router.get('/', asyncHandler(c.getReportCard));
router.get('/students', authorize('school_admin', 'teacher'), asyncHandler(c.getStudentList));

module.exports = router;
