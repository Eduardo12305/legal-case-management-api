const { Router } = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

router.get('/profile', (req, res) => userController.getProfile(req, res));
router.put('/profile', (req, res) => userController.updateProfile(req, res));
router.put('/profile/client', authorizeRoles('CLIENT'), (req, res) => userController.updateClientData(req, res));
router.put('/change-password', (req, res) => userController.changePassword(req, res));

router.get('/', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => userController.listUsers(req, res));
router.patch('/:id/toggle-active', authorizeRoles('ADMIN'), (req, res) => userController.toggleUserActive(req, res));

module.exports = router;
