const prisma = require('../../database/prisma.jsx');

class ProcessVersionRepository {
  async findLatestVersionNumber(processId) {
    const latest = await prisma.processVersion.findFirst({
      where: { processId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return latest?.versionNumber || 0;
  }

  async create(data) {
    return prisma.processVersion.create({ data });
  }
}

module.exports = ProcessVersionRepository;
