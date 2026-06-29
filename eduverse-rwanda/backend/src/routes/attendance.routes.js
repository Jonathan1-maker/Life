const router = require('express').Router();
const c = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.post('/', authorize('teacher', 'school_admin'), asyncHandler(c.markAttendance));
router.get('/class', asyncHandler(c.getClassAttendance));
router.get('/student/:id', asyncHandler(c.getStudentAttendance));
router.get('/report', authorize('teacher', 'school_admin', 'super_admin'), asyncHandler(c.getAttendanceReport));

module.exports = router;
