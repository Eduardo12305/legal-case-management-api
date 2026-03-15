const db = require('../../database/mysql.jsx');
const { generateId } = require('../../database/repositoryUtils.jsx');

class LegalEventRepository {
  async create(data) {
    const id = generateId();
    await db.execute(
      `INSERT INTO legal_events (
        id, process_id, author_id, type, title, description, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.processId,
        data.authorId ?? null,
        data.type,
        data.title,
        data.description ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );

    return {
      id,
      ...data,
      metadata: data.metadata ?? null,
    };
  }
}

module.exports = LegalEventRepository;
