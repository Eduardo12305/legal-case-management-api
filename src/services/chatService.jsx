const chatRepository = require('../repositories/chatRepository.jsx');
const userRepository = require('../repositories/userRepository.jsx');
const chatRealtimeService = require('./chatRealtimeService.jsx');
const AppError = require('../utils/appError.jsx');

class ChatService {
  async sendMessage(actor, { recipientId, content }) {
    const recipient = await userRepository.findById(recipientId);
    if (!recipient || !recipient.active) {
      throw new AppError('Destinatário não encontrado', 404);
    }

    if (!recipient.emailVerified) {
      throw new AppError('Destinatário sem email confirmado', 400);
    }

    const message = await chatRepository.createMessage({
      senderId: actor.id,
      recipientId,
      content,
    });

    chatRealtimeService.publishMessage(message);

    return message;
  }

  async getConversation(actor, recipientId, pagination) {
    const recipient = await userRepository.findById(recipientId);
    if (!recipient || !recipient.active) {
      throw new AppError('Destinatário não encontrado', 404);
    }

    return chatRepository.findConversation(actor.id, recipientId, pagination);
  }

  async subscribe(actor, res, recipientId) {
    if (recipientId) {
      const recipient = await userRepository.findById(recipientId);
      if (!recipient || !recipient.active) {
        throw new AppError('Destinatário não encontrado', 404);
      }
    }

    chatRealtimeService.subscribe(actor.id, res, recipientId);
  }
}

module.exports = new ChatService();
