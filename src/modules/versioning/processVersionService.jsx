class ProcessVersionService {
  constructor(processVersionRepository) {
    this.processVersionRepository = processVersionRepository;
  }

  async createVersion({
    processId,
    changedById,
    changeType,
    previousData,
    newData,
  }) {
    const latestVersion = await this.processVersionRepository.findLatestVersionNumber(processId);

    return this.processVersionRepository.create({
      processId,
      changedById,
      changeType,
      previousData,
      newData,
      versionNumber: latestVersion + 1,
    });
  }
}

module.exports = ProcessVersionService;
