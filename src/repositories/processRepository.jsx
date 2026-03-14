const prisma = require('../database/prisma.jsx');

class ProcessRepository {
  async create(data) {
    return prisma.process.create({
      data,
      include: { client: { include: { user: true } } },
    });
  }

  async findById(id) {
    return prisma.process.findUnique({
      where: { id },
      include: {
        client: { include: { user: true } },
        documents: true,
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByProcessNumber(processNumber) {
    return prisma.process.findUnique({
      where: { processNumber },
      include: { client: { include: { user: true } } },
    });
  }

  async findByClientId(clientId, { page = 1, limit = 20 } = {}) {
    const where = { clientId };

    const [processes, total] = await Promise.all([
      prisma.process.findMany({
        where,
        include: { documents: true, updates: { orderBy: { createdAt: 'desc' }, take: 3 } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.process.count({ where }),
    ]);

    return { processes, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findAll({ status, page = 1, limit = 20 }) {
    const where = {};
    if (status) where.status = status;

    const [processes, total] = await Promise.all([
      prisma.process.findMany({
        where,
        include: { client: { include: { user: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.process.count({ where }),
    ]);

    return { processes, total, page, totalPages: Math.ceil(total / limit) };
  }

  async update(id, data) {
    return prisma.process.update({
      where: { id },
      data,
      include: { client: { include: { user: true } } },
    });
  }

  async delete(id) {
    return prisma.process.delete({ where: { id } });
  }

  async addDocument(data) {
    return prisma.document.create({ data });
  }

  async addUpdate(data) {
    return prisma.processUpdate.create({ data });
  }
}

module.exports = new ProcessRepository();
