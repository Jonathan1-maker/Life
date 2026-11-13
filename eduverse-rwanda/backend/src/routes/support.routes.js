const router = require('express').Router();
const { getTickets, createTicket, updateTicketStatus, replyTicket } = require('../controllers/misc.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(getTickets));
router.post('/', asyncHandler(createTicket));
router.patch('/:id/status', authorize('super_admin'), asyncHandler(updateTicketStatus));
router.post('/:id/reply', authorize('super_admin'), asyncHandler(replyTicket));

module.exports = router;
