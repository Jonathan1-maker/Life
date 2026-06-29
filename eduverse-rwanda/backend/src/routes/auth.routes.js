const router = require('express').Router();
const { login, refreshToken, logout, getMe, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refreshToken));
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, asyncHandler(getMe));
router.put('/change-password', authenticate, asyncHandler(changePassword));

module.exports = router;
