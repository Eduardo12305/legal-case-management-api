const prisma = require('../database/prisma.jsx');

class ClientSearchRepository {
  async search({ search, active, page = 1, limit = 20, userId }) {
    const where = {
      user: {
        id: {
          not: userId,
        },
      },
    };

    if (active !== undefined) {
      where.user.active = active;
    }

    if (search) {
      where.OR = [
        { cpf: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          user: true,
          processes: {
            select: { id: true, processNumber: true, status: true, lawyerId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return { clients, total, page, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new ClientSearchRepository();
