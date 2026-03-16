const {
  enumValue,
  idParams,
  optionalString,
  pagination,
  requireObject,
  requireString,
} = require('./commonValidators.jsx');
const { ChatConversationTypes } = require('../modules/chat/chatConstants.jsx');

function chatBody(body) {
  const data = requireObject(body, 'Body');
  return {
    recipientId: requireString(data.recipientId, 'recipientId'),
    content: requireString(data.content, 'content'),
  };
}

function messageBody(body) {
  const data = requireObject(body, 'Body');
  return {
    content: requireString(data.content, 'content'),
  };
}

function resolveConversationBody(body) {
  const data = requireObject(body, 'Body');
  return {
    type: enumValue(requireString(data.type, 'type'), Object.values(ChatConversationTypes), 'type'),
    clientUserId: optionalString(data.clientUserId, 'clientUserId'),
    lawyerUserId: optionalString(data.lawyerUserId, 'lawyerUserId'),
  };
}

module.exports = {
  chatBody,
  messageBody,
  resolveConversationBody,
  conversationParams: (params) => idParams(params, 'conversationId'),
  conversationUserParams: (params) => idParams(params, 'userId'),
  paginationQuery: (query) => pagination(query || {}),
  streamQuery: (query) => {
    requireObject(query || {}, 'Query');
    return {
      recipientId: optionalString(query?.recipientId, 'recipientId') || undefined,
      conversationId: optionalString(query?.conversationId, 'conversationId') || undefined,
    };
  },
};
