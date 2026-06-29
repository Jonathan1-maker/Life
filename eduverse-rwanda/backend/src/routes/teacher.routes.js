const router = require('express').Router();
const c = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', authorize('super_admin', 'school_admin'), asyncHandler(c.getTeachers));
router.post('/', authorize('super_admin', 'school_admin'), asyncHandler(c.createTeacher));
router.get('/my/assignments', authorize('teacher'), asyncHandler(c.getMyAssignments));
router.get('/:id', asyncHandler(c.getTeacher));
router.put('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.updateTeacher));
router.delete('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.deleteTeacher));
router.get('/:id/subjects', asyncHandler(c.getTeacherSubjects));
router.post('/:id/subjects', authorize('super_admin', 'school_admin'), asyncHandler(c.assignSubject));
router.delete('/:id/subjects', authorize('super_admin', 'school_admin'), asyncHandler(c.removeSubject));

module.exports = router;
