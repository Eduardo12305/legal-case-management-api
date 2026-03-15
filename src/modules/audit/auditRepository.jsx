const db = require('../../database/mysql.jsx');
const { buildTotalPages, generateId, paginate } = require('../../database/repositoryUtils.jsx');

class AuditRepository {
  async create(data) {
    const id = data.id || generateId();
    await db.execute(
      `INSERT INTO audit_logs (
        id, actor_id, action, entity_type, entity_id, context, metadata,
        ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.actorId ?? null,
        data.action,
        data.entityType,
        data.entityId ?? null,
        data.context ? JSON.stringify(data.context) : null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.ipAddress ?? null,
        data.userAgent ?? null,
      ],
    );

    return { id, ...data };
  }

  async findByEntity({ entityType, entityId, page = 1, limit = 20 }) {
    const pagination = paginate({ page, limit });
    const params = [entityType, entityId];
    const rows = await db.query(
      `SELECT
        a.id,
        a.actor_id AS actorId,
        a.action,
        a.entity_type AS entityType,
        a.entity_id AS entityId,
        a.context,
        a.metadata,
        a.ip_address AS ipAddress,
        a.user_agent AS userAgent,
        a.created_at AS createdAt,
        u.id AS actor_id_ref,
        u.name AS actor_name,
        u.email AS actor_email,
        u.role AS actor_role
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.entity_type = ? AND a.entity_id = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total
       FROM audit_logs
       WHERE entity_type = ? AND entity_id = ?`,
      params,
    );

    return {
      logs: rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        createdAt: row.createdAt,
        actor: row.actor_id_ref ? {
          id: row.actor_id_ref,
          name: row.actor_name,
          email: row.actor_email,
          role: row.actor_role,
        } : null,
      })),
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }
}

module.exports = AuditRepository;
