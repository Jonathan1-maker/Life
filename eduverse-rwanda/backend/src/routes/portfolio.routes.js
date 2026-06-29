const router = require('express').Router();
const c = require('../controllers/portfolio.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/:studentId', asyncHandler(c.getPortfolio));
router.post('/:studentId', asyncHandler(c.addPortfolioItem));
router.delete('/:studentId/items/:id', asyncHandler(c.deletePortfolioItem));

module.exports = router;
