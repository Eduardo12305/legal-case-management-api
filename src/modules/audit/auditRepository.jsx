const prisma = require('../../database/prisma.jsx');

class AuditRepository {
  async create(data) {
    return prisma.auditLog.create({ data });
  }

  async findByEntity({ entityType, entityId, page = 1, limit = 20 }) {
    const where = {
      entityType,
      entityId,
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = AuditRepository;
