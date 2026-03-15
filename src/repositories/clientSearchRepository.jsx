const db = require('../database/mysql.jsx');
const { buildTotalPages, paginate } = require('../database/repositoryUtils.jsx');

class ClientSearchRepository {
  async search({ search, active, page = 1, limit = 20, userId }) {
    const pagination = paginate({ page, limit });
    const conditions = ['u.id <> ?'];
    const params = [userId];

    if (active !== undefined) {
      conditions.push('u.active = ?');
      params.push(active);
    }

    if (search) {
      conditions.push(`(
        c.cpf LIKE ?
        OR u.name LIKE ?
        OR u.email LIKE ?
        OR u.phone LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const clients = await db.query(
      `SELECT
        c.id,
        c.user_id AS userId,
        c.cpf,
        u.name,
        u.email,
        u.phone,
        u.active,
        (
          SELECT COUNT(*)
          FROM processes p
          WHERE p.client_id = c.id
        ) AS processCount
      FROM clients c
      INNER JOIN users u ON u.id = c.user_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total
       FROM clients c
       INNER JOIN users u ON u.id = c.user_id
       ${where}`,
      params,
    );

    return {
      clients,
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }
}

module.exports = new ClientSearchRepository();
