const prisma = require('../database/prisma');

class ClientRepository {
  async create(data) {
    return prisma.client.create({
      data,
      include: { user: true },
    });
  }

  async findById(id) {
    return prisma.client.findUnique({
      where: { id },
      include: { user: true, processes: true },
    });
  }

  async findByUserId(userId) {
    return prisma.client.findUnique({
      where: { userId },
      include: { user: true, processes: true },
    });
  }

  async findByCpf(cpf) {
    return prisma.client.findUnique({
      where: { cpf },
      include: { user: true },
    });
  }

  async findAll({ page = 1, limit = 20 }) {
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        include: { user: true, processes: { select: { id: true, status: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count(),
    ]);

    return { clients, total, page, totalPages: Math.ceil(total / limit) };
  }

  async update(id, data) {
    return prisma.client.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  async delete(id) {
    return prisma.client.delete({ where: { id } });
  }
}

module.exports = new ClientRepository();
