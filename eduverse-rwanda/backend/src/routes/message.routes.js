const router = require('express').Router();
const c = require('../controllers/message.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/super-admin', asyncHandler(c.getSuperAdmin));
router.get('/school-admin-contact', asyncHandler(c.getSchoolAdminContact));
router.get('/school-parents', asyncHandler(c.getSchoolParents));
router.get('/conversations', asyncHandler(c.getConversations));
router.get('/conversation', asyncHandler(c.getConversation));
router.get('/inbox', asyncHandler(c.getInbox));
router.get('/unread', asyncHandler(c.getUnreadCount));
router.post('/', asyncHandler(c.sendMessage));
router.patch('/:id/read', asyncHandler(c.markRead));
router.delete('/:id', asyncHandler(c.deleteMessage));

module.exports = router;
