const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const searchController = require('../controllers/searchController');

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many search requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const suggestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', searchLimiter, searchController.search);
router.get('/suggestions', suggestionLimiter, searchController.suggestions);

module.exports = router;
