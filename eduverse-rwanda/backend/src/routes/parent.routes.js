const router = require('express').Router();
const c = require('../controllers/parent.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', authorize('super_admin', 'school_admin'), asyncHandler(c.getParents));
router.post('/', authorize('super_admin', 'school_admin'), asyncHandler(c.createParent));
router.delete('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.deleteParent));
router.get('/:id/children', asyncHandler(c.getParentChildren));
router.post('/:id/link-child', authorize('super_admin', 'school_admin'), asyncHandler(c.linkChild));

module.exports = router;
