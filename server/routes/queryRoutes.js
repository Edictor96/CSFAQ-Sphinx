const { Router } = require('express');
const queryController = require('../controllers/queryController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

const router = Router();

router.post('/', authenticateUser, queryController.createQuery);
router.get('/me', authenticateUser, queryController.getMyQueries);

router.get('/', authenticateUser, authorizeRoles('admin', 'super_admin'), queryController.getAllQueries);
router.put('/:id', authenticateUser, authorizeRoles('admin', 'super_admin'), queryController.respondToQuery);

router.get('/all', authenticateUser, authorizeRoles('admin', 'super_admin'), queryController.getAllQueries);
router.patch('/:id/respond', authenticateUser, authorizeRoles('admin', 'super_admin'), queryController.respondToQuery);
router.delete('/:id', authenticateUser, queryController.deleteQuery);

module.exports = router;
