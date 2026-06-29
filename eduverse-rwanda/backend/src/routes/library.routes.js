const router = require('express').Router();
const c = require('../controllers/library.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

router.use(authenticate);
router.get('/books', asyncHandler(c.getBooks));
router.post('/books', authorize('super_admin', 'school_admin'), asyncHandler(c.addBook));
router.post('/books/:id/borrow', authorize('super_admin', 'school_admin'), asyncHandler(c.borrowBook));
router.patch('/borrowings/:borrowId/return', authorize('super_admin', 'school_admin'), asyncHandler(c.returnBook));

module.exports = router;
