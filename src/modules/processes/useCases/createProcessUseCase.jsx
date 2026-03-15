const AppError = require('../../../utils/appError.jsx');
const { AuditAction, AuditEntityType, LegalEventType } = require('../../shared/legalEnums.jsx');
const { canCreateProcess } = require('../../access-control/processPolicies.jsx');

class CreateProcessUseCase {
  constructor({
    processRepository,
    clientRepository,
    auditService,
    legalEventService,
    processVersionService,
  }) {
    this.processRepository = processRepository;
    this.clientRepository = clientRepository;
    this.auditService = auditService;
    this.legalEventService = legalEventService;
    this.processVersionService = processVersionService;
  }

  async execute({ actor, payload, requestContext }) {
    if (!canCreateProcess(actor)) {
      throw new AppError('Acesso negado para criar processos', 403);
    }

    if (actor.role !== 'LAWYER') {
      throw new AppError('Somente advogados criam processos na operação padrão', 403);
    }

    const client = await this.clientRepository.findById(payload.clientId);
    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const process = await this.processRepository.create({
      ...payload,
      lawyerId: actor.id,
    });

    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.PROCESS_CREATED,
      entityType: AuditEntityType.PROCESS,
      entityId: process.id,
      context: requestContext,
      metadata: {
        processNumber: process.processNumber,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    await this.legalEventService.register({
      processId: process.id,
      authorId: actor.id,
      type: LegalEventType.PROCESS_CREATED,
      title: 'Processo criado',
      description: `Processo ${process.processNumber} criado e atribuído ao advogado responsável.`,
      metadata: {
        lawyerId: actor.id,
      },
    });

    await this.processVersionService.createVersion({
      processId: process.id,
      changedById: actor.id,
      changeType: 'PROCESS_CREATED',
      previousData: null,
      newData: process,
    });

    return process;
  }
}

module.exports = CreateProcessUseCase;
