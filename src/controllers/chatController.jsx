const chatService = require('../services/chatService.jsx');

class ChatController {
  async send(req, res) {
    const message = await chatService.sendMessage(req.user, req.body);
    return res.status(201).json(message);
  }

  async getConversation(req, res) {
    const result = await chatService.getConversation(req.user, req.params.userId, req.query);
    return res.json(result);
  }

  async stream(req, res) {
    await chatService.subscribe(req.user, res, req.query.recipientId);
  }
}

module.exports = new ChatController();
