const prisma = require('../database/prisma.jsx');

class ChatRepository {
  async createMessage(data) {
    return prisma.chatMessage.create({ data });
  }

  async findConversation(userId, recipientId, { page = 1, limit = 50 } = {}) {
    const where = {
      OR: [
        { senderId: userId, recipientId },
        { senderId: recipientId, recipientId: userId },
      ],
    };

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatMessage.count({ where }),
    ]);

    return {
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new ChatRepository();
