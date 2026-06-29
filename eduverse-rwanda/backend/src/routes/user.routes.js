const router = require('express').Router();
const c = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', authorize('super_admin', 'school_admin'), asyncHandler(c.getUsers));
router.post('/', authorize('super_admin', 'school_admin'), asyncHandler(c.createUser));
router.get('/:id', asyncHandler(c.getUser));
router.put('/:id', asyncHandler(c.updateUser));
router.patch('/:id/deactivate', authorize('super_admin', 'school_admin'), asyncHandler(c.deactivateUser));
router.patch('/:id/reset-password', authorize('super_admin', 'school_admin'), asyncHandler(c.resetPassword));

module.exports = router;
