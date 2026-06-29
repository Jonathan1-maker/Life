const router = require('express').Router();
const { getNotifications, markAllRead, markOneRead, deleteNotification, clearNotifications } = require('../controllers/misc.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(getNotifications));
router.patch('/read-all', asyncHandler(markAllRead));
router.delete('/clear-all', asyncHandler(clearNotifications));
router.patch('/:id/read', asyncHandler(markOneRead));
router.delete('/:id', asyncHandler(deleteNotification));

module.exports = router;
