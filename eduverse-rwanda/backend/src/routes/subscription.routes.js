const router = require('express').Router();
const c = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate, authorize('super_admin'));
router.get('/', asyncHandler(c.getSubscriptions));
router.post('/', asyncHandler(c.createSubscription));
router.patch('/:id/revoke', asyncHandler(c.revokeSubscription));
router.patch('/:id/reinstate', asyncHandler(c.reinstateSubscription));

module.exports = router;
