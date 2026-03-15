const prisma = require('../database/prisma.jsx');

class UserRepository {
  async create(data) {
    return prisma.user.create({ data });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { client: true, userPermissions: true },
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { client: true, userPermissions: true },
    });
  }

  async findAll({ role, page = 1, limit = 20 }) {
    const where = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { client: true, userPermissions: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findVisibleUsers({ actor, role, page = 1, limit = 20 }) {
    const where = {
      id: {
        not: actor.id,
      },
    };
    if (role) where.role = role;

    if (actor.role === 'CLIENT') {
      where.id = '__forbidden__';
    } else if (actor.role === 'STAFF') {
      where.role = { in: ['STAFF', 'CLIENT'] };
    } else if (actor.role === 'LAWYER') {
      where.role = { in: ['STAFF', 'CLIENT'] };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { client: true, userPermissions: true },
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
      include: { client: true, userPermissions: true },
    });
  }

  async replaceStaffPermissions(userId, permissions, grantedById) {
    await prisma.userPermission.deleteMany({
      where: { userId },
    });

    if (permissions.length === 0) {
      return this.findById(userId);
    }

    await prisma.userPermission.createMany({
      data: permissions.map((permission) => ({
        userId,
        permission,
        grantedById,
      })),
    });

    return this.findById(userId);
  }

  async countActiveAdmins() {
    return prisma.user.count({
      where: {
        role: 'ADMIN',
        active: true,
      },
    });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }
}

module.exports = new UserRepository();
