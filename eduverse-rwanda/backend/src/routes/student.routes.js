const router = require('express').Router();
const c = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', authorize('super_admin', 'school_admin', 'teacher'), asyncHandler(c.getStudents));
router.get('/generate-admission', authorize('super_admin', 'school_admin'), asyncHandler(c.generateAdmissionNumber));
router.post('/', authorize('super_admin', 'school_admin'), asyncHandler(c.createStudent));
router.get('/:id', asyncHandler(c.getStudent));
router.put('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.updateStudent));
router.delete('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.deleteStudent));
router.patch('/:id/promote', authorize('super_admin', 'school_admin'), asyncHandler(c.promoteStudent));
router.get('/:id/parents', asyncHandler(c.getStudentParents));

module.exports = router;
