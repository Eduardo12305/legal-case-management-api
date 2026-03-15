const { idParams, pagination, requireObject, requireString } = require('./commonValidators.jsx');

function chatBody(body) {
  const data = requireObject(body, 'Body');
  return {
    recipientId: requireString(data.recipientId, 'recipientId'),
    content: requireString(data.content, 'content'),
  };
}

module.exports = {
  chatBody,
  conversationParams: (params) => idParams(params, 'userId'),
  paginationQuery: (query) => pagination(query || {}),
  streamQuery: (query) => ({
    recipientId: typeof query?.recipientId === 'string' && query.recipientId.trim()
      ? query.recipientId.trim()
      : undefined,
  }),
};
