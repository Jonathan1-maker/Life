const router = require('express').Router();
const c = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.get('/public-stats', asyncHandler(c.getPublicStats));
router.use(authenticate);
router.get('/overview', authorize('super_admin'), asyncHandler(c.getPlatformAnalytics));
router.get('/platform', authorize('super_admin'), asyncHandler(c.getPlatformAnalytics));
router.get('/school', authorize('super_admin', 'school_admin'), asyncHandler(c.getSchoolAnalytics));
router.post('/custom-report', authorize('super_admin'), asyncHandler(c.getCustomReport));

module.exports = router;
