const db = require('../database/mysql.jsx');
const { buildTotalPages, generateId, paginate } = require('../database/repositoryUtils.jsx');

class ChatRepository {
  async createMessage(data) {
    const id = generateId();
    await db.execute(
      `INSERT INTO chat_messages (id, sender_id, recipient_id, content, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, data.senderId, data.recipientId, data.content],
    );

    return db.one(
      `SELECT
        id,
        sender_id AS senderId,
        recipient_id AS recipientId,
        content,
        created_at AS createdAt
      FROM chat_messages
      WHERE id = ?
      LIMIT 1`,
      [id],
    );
  }

  async findConversation(userId, recipientId, { page = 1, limit = 50 } = {}) {
    const pagination = paginate({ page, limit });
    const where = `(
      (sender_id = ? AND recipient_id = ?)
      OR
      (sender_id = ? AND recipient_id = ?)
    )`;
    const params = [userId, recipientId, recipientId, userId];

    const messages = await db.query(
      `SELECT
        id,
        sender_id AS senderId,
        recipient_id AS recipientId,
        content,
        created_at AS createdAt
      FROM chat_messages
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total FROM chat_messages WHERE ${where}`,
      params,
    );

    return {
      messages: messages.reverse(),
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }
}

module.exports = new ChatRepository();
