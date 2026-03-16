const db = require('../database/mysql.jsx');
const { buildTotalPages, generateId, paginate } = require('../database/repositoryUtils.jsx');
const { buildChatChannelKey } = require('../modules/chat/chatConstants.jsx');

function mapUser(row, prefix) {
  const id = row[`${prefix}_id`];
  if (!id) return null;

  return {
    id,
    name: row[`${prefix}_name`],
    email: row[`${prefix}_email`],
    role: row[`${prefix}_role`],
  };
}

function mapMessageRow(row) {
  return {
    id: row.message_id ?? row.id,
    conversationId: row.message_conversation_id ?? row.conversation_id,
    senderId: row.message_sender_id ?? row.sender_id,
    content: row.message_content ?? row.content,
    createdAt: row.message_created_at ?? row.created_at,
    sender: mapUser(row, 'sender_user'),
  };
}

function mapConversationRow(row, lastMessage = null) {
  return {
    id: row.conversation_id,
    channelKey: row.conversation_channel_key,
    type: row.conversation_type,
    clientUserId: row.conversation_client_user_id,
    lawyerId: row.conversation_lawyer_id,
    createdAt: row.conversation_created_at,
    updatedAt: row.conversation_updated_at,
    client: mapUser(row, 'client_user'),
    lawyer: mapUser(row, 'lawyer_user'),
    lastMessage,
  };
}

function baseConversationSelect(whereClause = 'WHERE c.id = ?', orderClause = '') {
  return `
    SELECT
      c.id AS conversation_id,
      c.channel_key AS conversation_channel_key,
      c.type AS conversation_type,
      c.client_user_id AS conversation_client_user_id,
      c.lawyer_id AS conversation_lawyer_id,
      c.created_at AS conversation_created_at,
      c.updated_at AS conversation_updated_at,
      cu.id AS client_user_id,
      cu.name AS client_user_name,
      cu.email AS client_user_email,
      cu.role AS client_user_role,
      lu.id AS lawyer_user_id,
      lu.name AS lawyer_user_name,
      lu.email AS lawyer_user_email,
      lu.role AS lawyer_user_role
    FROM chat_conversations c
    INNER JOIN users cu ON cu.id = c.client_user_id
    LEFT JOIN users lu ON lu.id = c.lawyer_id
    ${whereClause}
    ${orderClause}
  `;
}

class ChatRepository {
  async ensureConversation({ type, clientUserId, lawyerId }) {
    const id = generateId();
    const channelKey = buildChatChannelKey({ type, clientUserId, lawyerId });

    await db.execute(
      `INSERT INTO chat_conversations (
        id, channel_key, type, client_user_id, lawyer_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = updated_at`,
      [id, channelKey, type, clientUserId, lawyerId ?? null],
    );

    return this.findConversationByChannelKey(channelKey);
  }

  async findConversationById(id) {
    const row = await db.one(
      baseConversationSelect('WHERE c.id = ? LIMIT 1'),
      [id],
    );

    if (!row) {
      return null;
    }

    const lastMessages = await this.findLastMessagesByConversationIds([row.conversation_id]);
    return mapConversationRow(row, lastMessages[row.conversation_id] || null);
  }

  async findConversationByChannelKey(channelKey) {
    const row = await db.one(
      baseConversationSelect('WHERE c.channel_key = ? LIMIT 1'),
      [channelKey],
    );

    if (!row) {
      return null;
    }

    const lastMessages = await this.findLastMessagesByConversationIds([row.conversation_id]);
    return mapConversationRow(row, lastMessages[row.conversation_id] || null);
  }

  async listByClientUserId(clientUserId) {
    return this.findConversations('WHERE c.client_user_id = ?', [clientUserId]);
  }

  async listByLawyerId(lawyerId) {
    return this.findConversations('WHERE c.lawyer_id = ?', [lawyerId]);
  }

  async listByType(type) {
    return this.findConversations('WHERE c.type = ?', [type]);
  }

  async listAll() {
    return this.findConversations('', []);
  }

  async findConversations(whereClause, params) {
    const rows = await db.query(
      baseConversationSelect(whereClause, 'ORDER BY c.updated_at DESC, c.created_at DESC'),
      params,
    );

    if (rows.length === 0) {
      return [];
    }

    const lastMessages = await this.findLastMessagesByConversationIds(rows.map((row) => row.conversation_id));
    return rows.map((row) => mapConversationRow(row, lastMessages[row.conversation_id] || null));
  }

  async createMessage({ conversationId, senderId, content }) {
    const id = generateId();

    await db.execute(
      `INSERT INTO chat_messages (id, conversation_id, sender_id, content, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, conversationId, senderId, content],
    );

    await db.execute(
      'UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?',
      [conversationId],
    );

    return this.findMessageById(id);
  }

  async findMessageById(id) {
    const row = await db.one(
      `SELECT
        m.id AS message_id,
        m.conversation_id AS message_conversation_id,
        m.sender_id AS message_sender_id,
        m.content AS message_content,
        m.created_at AS message_created_at,
        u.id AS sender_user_id,
        u.name AS sender_user_name,
        u.email AS sender_user_email,
        u.role AS sender_user_role
      FROM chat_messages m
      INNER JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?
      LIMIT 1`,
      [id],
    );

    return row ? mapMessageRow(row) : null;
  }

  async findMessages(conversationId, { page = 1, limit = 50 } = {}) {
    const pagination = paginate({ page, limit });

    const rows = await db.query(
      `SELECT
        m.id AS message_id,
        m.conversation_id AS message_conversation_id,
        m.sender_id AS message_sender_id,
        m.content AS message_content,
        m.created_at AS message_created_at,
        u.id AS sender_user_id,
        u.name AS sender_user_name,
        u.email AS sender_user_email,
        u.role AS sender_user_role
      FROM chat_messages m
      INNER JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ? OFFSET ?`,
      [conversationId, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      'SELECT COUNT(*) AS total FROM chat_messages WHERE conversation_id = ?',
      [conversationId],
    );

    return {
      messages: rows.reverse().map(mapMessageRow),
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }

  async findLastMessagesByConversationIds(conversationIds) {
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return {};
    }

    const placeholders = conversationIds.map(() => '?').join(', ');
    const rows = await db.query(
      `SELECT
        m.id AS message_id,
        m.conversation_id AS message_conversation_id,
        m.sender_id AS message_sender_id,
        m.content AS message_content,
        m.created_at AS message_created_at,
        u.id AS sender_user_id,
        u.name AS sender_user_name,
        u.email AS sender_user_email,
        u.role AS sender_user_role
      FROM chat_messages m
      INNER JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id IN (${placeholders})
      ORDER BY m.created_at DESC, m.id DESC`,
      conversationIds,
    );

    return rows.reduce((accumulator, row) => {
      const conversationId = row.message_conversation_id;
      if (!accumulator[conversationId]) {
        accumulator[conversationId] = mapMessageRow(row);
      }
      return accumulator;
    }, {});
  }
}

module.exports = new ChatRepository();
