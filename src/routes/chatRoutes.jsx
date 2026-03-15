const { Router } = require('express');
const chatController = require('../controllers/chatController.jsx');
const { authMiddleware } = require('../middlewares/auth.jsx');
const validateRequest = require('../middlewares/validateRequest.jsx');
const asyncHandler = require('../utils/asyncHandler.jsx');
const { chatBody, conversationParams, paginationQuery, streamQuery } = require('../validators/chatValidators.jsx');

const router = Router();

router.use(authMiddleware);

router.post('/', validateRequest({ body: chatBody }), asyncHandler((req, res) => chatController.send(req, res)));
router.get('/stream', validateRequest({ query: streamQuery }), asyncHandler((req, res) => chatController.stream(req, res)));
router.get('/conversation/:userId', validateRequest({ params: conversationParams, query: paginationQuery }), asyncHandler((req, res) => chatController.getConversation(req, res)));

module.exports = router;
