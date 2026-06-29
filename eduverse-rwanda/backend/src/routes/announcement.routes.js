const router = require('express').Router();
const c = require('../controllers/announcement.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(c.getAnnouncements));
router.post('/', authorize('super_admin', 'school_admin', 'teacher'), asyncHandler(c.createAnnouncement));
router.delete('/:id', authorize('super_admin', 'school_admin'), asyncHandler(c.deleteAnnouncement));

module.exports = router;
