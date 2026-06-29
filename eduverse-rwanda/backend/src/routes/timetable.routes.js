const router = require('express').Router();
const c = require('../controllers/timetable.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);

router.get('/', asyncHandler(c.getTimetable));
router.get('/mine', authorize('teacher'), asyncHandler(c.getMyTimetable));
router.put('/', authorize('school_admin'), asyncHandler(c.upsertSlot));
router.delete('/', authorize('school_admin'), asyncHandler(c.deleteSlot));

module.exports = router;
