const router = require('express').Router();
const c = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(c.getCourses));
router.post('/', authorize('teacher', 'school_admin'), asyncHandler(c.createCourse));
router.get('/:id', asyncHandler(c.getCourse));
router.post('/:id/lessons', authorize('teacher', 'school_admin'), asyncHandler(c.addLesson));
router.patch('/:id/publish', authorize('teacher', 'school_admin'), asyncHandler(c.publishCourse));

module.exports = router;
