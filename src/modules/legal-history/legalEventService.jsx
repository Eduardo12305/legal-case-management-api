class LegalEventService {
  constructor(legalEventRepository) {
    this.legalEventRepository = legalEventRepository;
  }

  async register({
    processId,
    authorId,
    type,
    title,
    description,
    metadata,
  }) {
    return this.legalEventRepository.create({
      processId,
      authorId,
      type,
      title,
      description,
      metadata,
    });
  }
}

module.exports = LegalEventService;
