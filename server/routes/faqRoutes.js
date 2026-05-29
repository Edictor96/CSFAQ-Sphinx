const { Router } = require('express');
const faqController = require('../controllers/faqController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

const router = Router();

router.get('/', authenticateUser, faqController.getFAQs);
router.get('/categories', authenticateUser, faqController.getCategories);
router.get('/search', authenticateUser, faqController.searchFAQs);
router.post('/chat', authenticateUser, faqController.chatQuery);
router.get('/:id', authenticateUser, faqController.getFaqById);

router.post('/', authenticateUser, authorizeRoles('admin', 'super_admin'), faqController.createFaq);
router.put('/:id', authenticateUser, authorizeRoles('admin', 'super_admin'), faqController.updateFaq);
router.delete('/:id', authenticateUser, authorizeRoles('admin', 'super_admin'), faqController.deleteFaq);

module.exports = router;
