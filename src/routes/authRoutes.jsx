const { Router } = require('express');
const authController = require('../controllers/authController.jsx');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.jsx');
const validateRequest = require('../middlewares/validateRequest.jsx');
const asyncHandler = require('../utils/asyncHandler.jsx');
const {
  inviteBody,
  loginBody,
  registerBody,
  verifyEmailQuery,
} = require('../validators/authValidators.jsx');

const router = Router();

router.post('/register', validateRequest({ body: registerBody }), asyncHandler((req, res) => authController.register(req, res)));
router.post('/login', validateRequest({ body: loginBody }), asyncHandler((req, res) => authController.login(req, res)));
router.get('/invite-options', authMiddleware, authorizeRoles('ADMIN'), asyncHandler((req, res) => authController.getInviteOptions(req, res)));
router.post('/invites', authMiddleware, authorizeRoles('ADMIN'), validateRequest({ body: inviteBody }), asyncHandler((req, res) => authController.createInvite(req, res)));
router.get('/verify-email', validateRequest({ query: verifyEmailQuery }), asyncHandler((req, res) => authController.verifyEmail(req, res)));

module.exports = router;
