const { Router } = require('express');
const chatController = require('../controllers/chatController.jsx');
const { authMiddleware } = require('../middlewares/auth.jsx');
const validateRequest = require('../middlewares/validateRequest.jsx');
const asyncHandler = require('../utils/asyncHandler.jsx');
const {
  chatBody,
  conversationParams,
  conversationUserParams,
  messageBody,
  paginationQuery,
  resolveConversationBody,
  streamQuery,
} = require('../validators/chatValidators.jsx');

const router = Router();

router.use(authMiddleware);

router.get('/conversations', asyncHandler((req, res) => chatController.listConversations(req, res)));
router.post('/conversations/resolve', validateRequest({ body: resolveConversationBody }), asyncHandler((req, res) => chatController.resolveConversation(req, res)));
router.get('/conversations/:conversationId/messages', validateRequest({ params: conversationParams, query: paginationQuery }), asyncHandler((req, res) => chatController.getMessages(req, res)));
router.post('/conversations/:conversationId/messages', validateRequest({ params: conversationParams, body: messageBody }), asyncHandler((req, res) => chatController.sendMessage(req, res)));
router.post('/', validateRequest({ body: chatBody }), asyncHandler((req, res) => chatController.send(req, res)));
router.get('/stream', validateRequest({ query: streamQuery }), asyncHandler((req, res) => chatController.stream(req, res)));
router.get('/conversation/:userId', validateRequest({ params: conversationUserParams, query: paginationQuery }), asyncHandler((req, res) => chatController.getConversation(req, res)));

module.exports = router;
