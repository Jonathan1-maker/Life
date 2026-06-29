const router = require('express').Router();
const c = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', asyncHandler(c.getClasses));
router.post('/', authorize('super_admin', 'school_admin'), asyncHandler(c.createClass));
router.put('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.updateClass));
router.delete('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.deleteClass));
router.get('/:id/streams', asyncHandler(c.getStreams));
router.post('/:id/streams', authorize('super_admin', 'school_admin'), asyncHandler(c.createStream));

module.exports = router;
