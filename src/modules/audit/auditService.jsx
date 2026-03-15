class AuditService {
  constructor(auditRepository) {
    this.auditRepository = auditRepository;
  }

  async record({
    actorId,
    action,
    entityType,
    entityId,
    context,
    metadata,
    ipAddress,
    userAgent,
  }) {
    return this.auditRepository.create({
      actorId,
      action,
      entityType,
      entityId,
      context,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  async listByEntity({ entityType, entityId, page, limit }) {
    return this.auditRepository.findByEntity({
      entityType,
      entityId,
      page,
      limit,
    });
  }
}

module.exports = AuditService;
