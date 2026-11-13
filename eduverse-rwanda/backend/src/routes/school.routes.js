const router = require('express').Router();
const c = require('../controllers/school.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', authorize('super_admin'), asyncHandler(c.getAllSchools));
router.post('/', authorize('super_admin'), asyncHandler(c.createSchool));
router.delete('/', authorize('super_admin'), asyncHandler(c.deleteAllSchools));
router.get('/my', asyncHandler(c.getMySchool));
router.post('/my/marks-lock', authorize('school_admin'), asyncHandler(c.setMarksLock));
router.get('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.getSchool));
router.put('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.updateSchool));
router.patch('/:id/status', authorize('super_admin'), asyncHandler(c.updateSchoolStatus));
router.delete('/:id', authorize('super_admin'), asyncHandler(c.deleteSchool));
router.get('/:id/stats', authorize('super_admin', 'school_admin'), asyncHandler(c.getSchoolStats));
router.delete('/:id/data', authorize('super_admin'), asyncHandler(c.clearSchoolData));

module.exports = router;
