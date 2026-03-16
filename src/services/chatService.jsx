const chatRepository = require('../repositories/chatRepository.jsx');
const processRepository = require('../repositories/processRepository.jsx');
const userRepository = require('../repositories/userRepository.jsx');
const chatRealtimeService = require('./chatRealtimeService.jsx');
const AppError = require('../utils/appError.jsx');
const { ChatConversationTypes, buildChatChannelKey } = require('../modules/chat/chatConstants.jsx');

const GENERAL_CHAT_ROLES = ['STAFF', 'ADMIN'];

function isGeneralChatRole(role) {
  return GENERAL_CHAT_ROLES.includes(role);
}

class ChatService {
  async requireChatUser(userId, expectedRole, label) {
    const user = await userRepository.findById(userId);

    if (!user || !user.active) {
      throw new AppError(`${label} não encontrado`, 404);
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new AppError(`${label} inválido`, 400);
    }

    if (!user.emailVerified) {
      throw new AppError(`${label} sem email confirmado`, 400);
    }

    return user;
  }

  async ensureConversationAccess(actor, conversationOrId, { requireWrite = false } = {}) {
    const conversation = typeof conversationOrId === 'string'
      ? await chatRepository.findConversationById(conversationOrId)
      : conversationOrId;

    if (!conversation) {
      throw new AppError('Conversa não encontrada', 404);
    }

    if (!this.canViewConversation(actor, conversation)) {
      throw new AppError('Acesso negado', 403);
    }

    if (requireWrite && !this.canSendMessage(actor, conversation)) {
      throw new AppError('Acesso negado', 403);
    }

    return conversation;
  }

  canViewConversation(actor, conversation) {
    if (actor.role === 'ADMIN') {
      return true;
    }

    if (actor.role === 'CLIENT') {
      return conversation.clientUserId === actor.id;
    }

    if (actor.role === 'LAWYER') {
      return conversation.type === ChatConversationTypes.LAWYER && conversation.lawyerId === actor.id;
    }

    if (actor.role === 'STAFF') {
      return conversation.type === ChatConversationTypes.GENERAL;
    }

    return false;
  }

  canSendMessage(actor, conversation) {
    if (actor.role === 'ADMIN') {
      return true;
    }

    if (actor.role === 'CLIENT') {
      return conversation.clientUserId === actor.id;
    }

    if (actor.role === 'LAWYER') {
      return conversation.type === ChatConversationTypes.LAWYER && conversation.lawyerId === actor.id;
    }

    if (actor.role === 'STAFF') {
      return conversation.type === ChatConversationTypes.GENERAL;
    }

    return false;
  }

  async ensureClientVisibleLawyerConversation(actor, clientUserId, lawyerUserId) {
    if (actor.role !== 'CLIENT') {
      return;
    }

    const linkedLawyerIds = await processRepository.findLinkedLawyerIdsByClientUserId(clientUserId);
    if (linkedLawyerIds.includes(lawyerUserId)) {
      return;
    }

    const existingConversation = await chatRepository.findConversationByChannelKey(
      buildChatChannelKey({
        type: ChatConversationTypes.LAWYER,
        clientUserId,
        lawyerId: lawyerUserId,
      }),
    );

    if (!existingConversation) {
      throw new AppError('Advogado não disponível para este cliente', 403);
    }
  }

  async ensureGeneralConversation(actor, clientUserId) {
    if (!clientUserId) {
      throw new AppError('clientUserId é obrigatório', 400);
    }

    if (actor.role === 'CLIENT' && clientUserId !== actor.id) {
      throw new AppError('Acesso negado', 403);
    }

    if (actor.role === 'LAWYER') {
      throw new AppError('Acesso negado', 403);
    }

    await this.requireChatUser(clientUserId, 'CLIENT', 'Cliente');
    return chatRepository.ensureConversation({
      type: ChatConversationTypes.GENERAL,
      clientUserId,
    });
  }

  async ensureLawyerConversation(actor, clientUserId, lawyerUserId) {
    if (!clientUserId) {
      throw new AppError('clientUserId é obrigatório', 400);
    }

    if (!lawyerUserId) {
      throw new AppError('lawyerUserId é obrigatório', 400);
    }

    if (actor.role === 'CLIENT') {
      if (clientUserId !== actor.id) {
        throw new AppError('Acesso negado', 403);
      }

      await this.ensureClientVisibleLawyerConversation(actor, clientUserId, lawyerUserId);
    } else if (actor.role === 'LAWYER') {
      if (lawyerUserId !== actor.id) {
        throw new AppError('Acesso negado', 403);
      }
    } else if (actor.role !== 'ADMIN') {
      throw new AppError('Acesso negado', 403);
    }

    await this.requireChatUser(clientUserId, 'CLIENT', 'Cliente');
    await this.requireChatUser(lawyerUserId, 'LAWYER', 'Advogado');

    return chatRepository.ensureConversation({
      type: ChatConversationTypes.LAWYER,
      clientUserId,
      lawyerId: lawyerUserId,
    });
  }

  async resolveConversation(actor, { type, clientUserId, lawyerUserId }) {
    if (type === ChatConversationTypes.GENERAL) {
      const resolvedClientUserId = actor.role === 'CLIENT' ? actor.id : clientUserId;
      return this.formatConversation(
        actor,
        await this.ensureGeneralConversation(actor, resolvedClientUserId),
      );
    }

    const resolvedClientUserId = actor.role === 'CLIENT' ? actor.id : clientUserId;
    const resolvedLawyerUserId = actor.role === 'LAWYER' ? actor.id : lawyerUserId;

    return this.formatConversation(
      actor,
      await this.ensureLawyerConversation(actor, resolvedClientUserId, resolvedLawyerUserId),
    );
  }

  async resolveConversationFromUsers(actor, otherUserId) {
    const otherUser = await userRepository.findById(otherUserId);
    if (!otherUser || !otherUser.active) {
      throw new AppError('Destinatário não encontrado', 404);
    }

    if (!otherUser.emailVerified) {
      throw new AppError('Destinatário sem email confirmado', 400);
    }

    if (actor.role === 'CLIENT' && otherUser.role === 'LAWYER') {
      return this.ensureLawyerConversation(actor, actor.id, otherUser.id);
    }

    if (actor.role === 'LAWYER' && otherUser.role === 'CLIENT') {
      return this.ensureLawyerConversation(actor, otherUser.id, actor.id);
    }

    if (actor.role === 'CLIENT' && isGeneralChatRole(otherUser.role)) {
      return this.ensureGeneralConversation(actor, actor.id);
    }

    if (isGeneralChatRole(actor.role) && otherUser.role === 'CLIENT') {
      return this.ensureGeneralConversation(actor, otherUser.id);
    }

    throw new AppError('Conversa direta não suportada para esses perfis', 400);
  }

  async ensureVisibleConversations(actor) {
    if (actor.role === 'CLIENT') {
      await this.ensureGeneralConversation(actor, actor.id);
      const linkedLawyerIds = await processRepository.findLinkedLawyerIdsByClientUserId(actor.id);
      for (const lawyerId of linkedLawyerIds) {
        await chatRepository.ensureConversation({
          type: ChatConversationTypes.LAWYER,
          clientUserId: actor.id,
          lawyerId,
        });
      }
      return;
    }

    if (actor.role === 'LAWYER') {
      const linkedClientUserIds = await processRepository.findLinkedClientUserIdsByLawyerId(actor.id);
      for (const clientUserId of linkedClientUserIds) {
        await chatRepository.ensureConversation({
          type: ChatConversationTypes.LAWYER,
          clientUserId,
          lawyerId: actor.id,
        });
      }
    }
  }

  formatConversation(actor, conversation) {
    const title = conversation.type === ChatConversationTypes.GENERAL
      ? 'Atendimento geral'
      : actor.role === 'CLIENT'
        ? (conversation.lawyer?.name || 'Advogado')
        : (conversation.client?.name || 'Cliente');

    const counterpart = conversation.type === ChatConversationTypes.GENERAL
      ? (actor.role === 'CLIENT'
        ? { id: 'general-support', name: 'Equipe de atendimento', role: 'STAFF' }
        : conversation.client)
      : (actor.role === 'CLIENT' ? conversation.lawyer : conversation.client);

    return {
      ...conversation,
      title,
      counterpart,
      canSend: this.canSendMessage(actor, conversation),
    };
  }

  async listConversations(actor) {
    await this.ensureVisibleConversations(actor);

    let conversations;
    if (actor.role === 'CLIENT') {
      conversations = await chatRepository.listByClientUserId(actor.id);
    } else if (actor.role === 'LAWYER') {
      conversations = await chatRepository.listByLawyerId(actor.id);
    } else if (actor.role === 'STAFF') {
      conversations = await chatRepository.listByType(ChatConversationTypes.GENERAL);
    } else {
      conversations = await chatRepository.listAll();
    }

    return {
      conversations: conversations.map((conversation) => this.formatConversation(actor, conversation)),
    };
  }

  async sendMessage(actor, { recipientId, content }) {
    const conversation = await this.resolveConversationFromUsers(actor, recipientId);
    return this.sendMessageToConversation(actor, conversation.id, { content });
  }

  async sendMessageToConversation(actor, conversationId, { content }) {
    const conversation = await this.ensureConversationAccess(actor, conversationId, { requireWrite: true });

    const message = await chatRepository.createMessage({
      conversationId: conversation.id,
      senderId: actor.id,
      content,
    });

    const audienceUserIds = await this.getConversationAudienceUserIds(conversation);
    chatRealtimeService.publishMessage(message, audienceUserIds);

    return message;
  }

  async getConversation(actor, recipientId, pagination) {
    const conversation = await this.resolveConversationFromUsers(actor, recipientId);
    return this.getConversationMessages(actor, conversation.id, pagination);
  }

  async getConversationMessages(actor, conversationId, pagination) {
    await this.ensureConversationAccess(actor, conversationId);
    return chatRepository.findMessages(conversationId, pagination);
  }

  async getConversationAudienceUserIds(conversation) {
    if (conversation.type === ChatConversationTypes.GENERAL) {
      const supportUserIds = await userRepository.findActiveUserIdsByRoles(GENERAL_CHAT_ROLES);
      return [conversation.clientUserId, ...supportUserIds];
    }

    return [conversation.clientUserId, conversation.lawyerId];
  }

  async subscribe(actor, res, { recipientId, conversationId }) {
    let resolvedConversationId = conversationId;

    if (resolvedConversationId) {
      await this.ensureConversationAccess(actor, resolvedConversationId);
    } else if (recipientId) {
      const conversation = await this.resolveConversationFromUsers(actor, recipientId);
      resolvedConversationId = conversation.id;
    }

    chatRealtimeService.subscribe(actor.id, res, resolvedConversationId);
  }
}

module.exports = new ChatService();
