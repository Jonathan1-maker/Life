const router = require('express').Router();
const c = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(c.getEvents));
router.post('/', authorize('super_admin', 'school_admin'), asyncHandler(c.createEvent));
router.delete('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.deleteEvent));

module.exports = router;
