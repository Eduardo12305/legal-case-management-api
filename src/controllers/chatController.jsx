const chatService = require('../services/chatService.jsx');

class ChatController {
  async listConversations(req, res) {
    const result = await chatService.listConversations(req.user);
    return res.json(result);
  }

  async resolveConversation(req, res) {
    const conversation = await chatService.resolveConversation(req.user, req.body);
    return res.json(conversation);
  }

  async sendMessage(req, res) {
    const message = await chatService.sendMessageToConversation(req.user, req.params.conversationId, req.body);
    return res.status(201).json(message);
  }

  async getMessages(req, res) {
    const result = await chatService.getConversationMessages(req.user, req.params.conversationId, req.query);
    return res.json(result);
  }

  async send(req, res) {
    const message = await chatService.sendMessage(req.user, req.body);
    return res.status(201).json(message);
  }

  async getConversation(req, res) {
    const result = await chatService.getConversation(req.user, req.params.userId, req.query);
    return res.json(result);
  }

  async stream(req, res) {
    await chatService.subscribe(req.user, res, req.query);
  }
}

module.exports = new ChatController();
