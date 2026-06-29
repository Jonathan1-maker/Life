const router = require('express').Router();
const { globalSearch } = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/', asyncHandler(globalSearch));

module.exports = router;
