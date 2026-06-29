const router = require('express').Router();
const c = require('../controllers/subject.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(c.getSubjects));
router.post('/', authorize('super_admin', 'school_admin'), asyncHandler(c.createSubject));
router.put('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.updateSubject));
router.delete('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.deleteSubject));

module.exports = router;
