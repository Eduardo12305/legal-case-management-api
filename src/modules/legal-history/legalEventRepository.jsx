const prisma = require('../../database/prisma.jsx');

class LegalEventRepository {
  async create(data) {
    return prisma.legalEvent.create({ data });
  }
}

module.exports = LegalEventRepository;
