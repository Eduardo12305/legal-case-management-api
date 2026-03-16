const ChatConversationTypes = Object.freeze({
  GENERAL: 'GENERAL',
  LAWYER: 'LAWYER',
});

function buildChatChannelKey({ type, clientUserId, lawyerId }) {
  if (type === ChatConversationTypes.GENERAL) {
    return `${ChatConversationTypes.GENERAL}:${clientUserId}`;
  }

  if (type === ChatConversationTypes.LAWYER && lawyerId) {
    return `${ChatConversationTypes.LAWYER}:${clientUserId}:${lawyerId}`;
  }

  throw new Error('Canal de conversa inválido');
}

module.exports = {
  ChatConversationTypes,
  buildChatChannelKey,
};
