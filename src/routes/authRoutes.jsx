const { Router } = require('express');
const authController = require('../controllers/authController.jsx');
const validateRequest = require('../middlewares/validateRequest.jsx');
const asyncHandler = require('../utils/asyncHandler.jsx');
const { loginBody, registerBody } = require('../validators/authValidators.jsx');

const router = Router();

router.post('/register', validateRequest({ body: registerBody }), asyncHandler((req, res) => authController.register(req, res)));
router.post('/login', validateRequest({ body: loginBody }), asyncHandler((req, res) => authController.login(req, res)));

module.exports = router;
