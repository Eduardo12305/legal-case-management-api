const { Router } = require('express');
const clientController = require('../controllers/clientController.jsx');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.jsx');
const validateRequest = require('../middlewares/validateRequest.jsx');
const asyncHandler = require('../utils/asyncHandler.jsx');
const { clientSearchQuery, userIdParams } = require('../validators/clientValidators.jsx');

const router = Router();

router.use(authMiddleware);

router.get('/', validateRequest({ query: clientSearchQuery }), asyncHandler((req, res) => clientController.search(req, res)));
router.patch('/:id/active', authorizeRoles('ADMIN'), validateRequest({ params: userIdParams }), asyncHandler((req, res) => clientController.toggleActive(req, res)));

module.exports = router;
