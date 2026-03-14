const prisma = require('../database/prisma.jsx');

class UserRepository {
  async create(data) {
    return prisma.user.create({ data });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { client: true },
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { client: true },
    });
  }

  async findAll({ role, page = 1, limit = 20 }) {
    const where = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { client: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      include: { client: true },
    });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }
}

module.exports = new UserRepository();
