const processRepository = require('../repositories/processRepository.jsx');
const clientRepository = require('../repositories/clientRepository.jsx');
const AppError = require('../utils/appError.jsx');
const AuditRepository = require('../modules/audit/auditRepository.jsx');
const AuditService = require('../modules/audit/auditService.jsx');
const { AuditAction, AuditEntityType } = require('../modules/shared/legalEnums.jsx');
const {
  ensureEnumValue,
  normalizeDecimal,
  normalizeOptionalString,
  normalizeRequiredString,
} = require('../utils/validation.jsx');
const {
  canChangeProcessStatus,
  canCreateProcess,
  canUpdateProcess,
  canViewProcess,
} = require('../modules/access-control/processPolicies.jsx');

const auditService = new AuditService(new AuditRepository());

const ALLOWED_PROCESS_STATUS = ['ACTIVE', 'ARCHIVED', 'SUSPENDED', 'CLOSED', 'WON', 'LOST'];
const PROCESS_STATUS_ALIASES = {
  active: 'ACTIVE',
  ativo: 'ACTIVE',
  archived: 'ARCHIVED',
  arquivado: 'ARCHIVED',
  suspended: 'SUSPENDED',
  suspenso: 'SUSPENDED',
  closed: 'CLOSED',
  fechado: 'CLOSED',
  won: 'WON',
  ganho: 'WON',
  lost: 'LOST',
  perdido: 'LOST',
};

function normalizeProcessStatus(status) {
  if (status === undefined) {
    return undefined;
  }

  if (typeof status !== 'string') {
    throw new Error('Status inválido');
  }

  const trimmedStatus = status.trim();
  if (!trimmedStatus) {
    return undefined;
  }

  const normalizedByAlias = PROCESS_STATUS_ALIASES[trimmedStatus.toLowerCase()];
  return ensureEnumValue(normalizedByAlias || trimmedStatus.toUpperCase(), ALLOWED_PROCESS_STATUS, 'Status');
}

function normalizeProcessPayload(data, { partial = false } = {}) {
  const normalizedData = {};
  const optionalTextFields = ['description', 'court', 'instance', 'subject'];
  const fieldLabels = {
    description: 'Descrição',
    court: 'Tribunal',
    instance: 'Instância',
    subject: 'Assunto',
  };

  if (!partial) {
    normalizedData.clientId = normalizeRequiredString(data.clientId, 'ClientId');
  } else if (Object.prototype.hasOwnProperty.call(data, 'clientId')) {
    normalizedData.clientId = normalizeRequiredString(data.clientId, 'ClientId');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'lawyerId')) {
    normalizedData.lawyerId = normalizeOptionalString(data.lawyerId, 'Advogado');
  }

  if (!partial) {
    normalizedData.processNumber = normalizeRequiredString(data.processNumber, 'Número do processo');
  } else if (Object.prototype.hasOwnProperty.call(data, 'processNumber')) {
    normalizedData.processNumber = normalizeRequiredString(data.processNumber, 'Número do processo');
  }

  if (!partial) {
    normalizedData.title = normalizeRequiredString(data.title, 'Título');
  } else if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    normalizedData.title = normalizeRequiredString(data.title, 'Título');
  }

  for (const field of optionalTextFields) {
    if ((!partial && data[field] !== undefined) || Object.prototype.hasOwnProperty.call(data, field)) {
      normalizedData[field] = normalizeOptionalString(data[field], fieldLabels[field]);
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'value')) {
    normalizedData.value = normalizeDecimal(data.value, 'Valor');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'status')) {
    normalizedData.status = normalizeProcessStatus(data.status);
  }

  return normalizedData;
}

class ProcessService {
  async recordAudit(actor, action, entityId, metadata) {
    await auditService.record({
      actorId: actor?.id || null,
      action,
      entityType: AuditEntityType.PROCESS,
      entityId,
      metadata,
    });
  }

  async resolveClientId(clientIdentifier) {
    const directClient = await clientRepository.findById(clientIdentifier);
    if (directClient) {
      return directClient.id;
    }

    const clientByUserId = await clientRepository.findByUserId(clientIdentifier);
    if (clientByUserId) {
      return clientByUserId.id;
    }

    throw new Error('Cliente não encontrado');
  }

  async create(actor, { clientId, lawyerId, processNumber, number, title, description, court, instance, subject, value, status }) {
    if (!canCreateProcess(actor) || actor.role !== 'LAWYER') {
      throw new AppError('Apenas advogados podem criar processos', 403);
    }

    const payload = normalizeProcessPayload({
      clientId,
      lawyerId: lawyerId ?? actor.id,
      processNumber: processNumber ?? number,
      title,
      description,
      court,
      instance,
      subject,
      value,
      status,
    });

    payload.clientId = await this.resolveClientId(payload.clientId);

    const existing = await processRepository.findByProcessNumber(payload.processNumber);
    if (existing) throw new Error('Número de processo já cadastrado');

    const createdProcess = await processRepository.create({
      ...payload,
      lawyerId: actor.id,
    });

    await this.recordAudit(actor, AuditAction.PROCESS_CREATED, createdProcess.id, {
      processNumber: createdProcess.processNumber,
      title: createdProcess.title,
      status: createdProcess.status,
      clientId: createdProcess.clientId,
      lawyerId: createdProcess.lawyerId,
    });

    return createdProcess;
  }

  async getById(id, requester) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    if (!canViewProcess(requester, process)) {
      throw new AppError('Acesso negado', 403);
    }

    return process;
  }

  async getByClientId(actor, clientId, pagination) {
    const resolvedClientId = await this.resolveClientId(clientId);

    if (actor?.role === 'LAWYER') {
      const result = await processRepository.findByClientId(resolvedClientId, {
        ...pagination,
        lawyerId: actor.id,
      });

      console.log('[process:getByClientId]', {
        actorId: actor.id,
        actorRole: actor.role,
        requestedClientId: clientId,
        resolvedClientId,
        total: result.total,
        returned: result.processes.length,
      });

      return result;
    }

    const result = await processRepository.findByClientId(resolvedClientId, pagination);

    console.log('[process:getByClientId]', {
      actorId: actor?.id,
      actorRole: actor?.role,
      requestedClientId: clientId,
      resolvedClientId,
      total: result.total,
      returned: result.processes.length,
    });

    return result;
  }

  async getMyProcesses(userId, pagination) {
    const client = await clientRepository.findByUserId(userId);
    if (!client) throw new Error('Perfil de cliente não encontrado');
    return processRepository.findByClientId(client.id, pagination);
  }

  async listAll(actor, filters) {
    const normalizedStatus = normalizeProcessStatus(filters.status);

    if (actor?.role === 'LAWYER') {
      return processRepository.findAll({
        ...filters,
        lawyerId: actor.id,
        status: normalizedStatus,
      });
    }

    return processRepository.findAll({ ...filters, status: normalizedStatus });
  }

  async update(actor, id, data) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    if (!canUpdateProcess(actor, process)) {
      throw new AppError('Acesso negado', 403);
    }

    const updateData = normalizeProcessPayload(data, { partial: true });

    if (updateData.clientId && updateData.clientId !== process.clientId) {
      updateData.clientId = await this.resolveClientId(updateData.clientId);
    }

    if (updateData.processNumber && updateData.processNumber !== process.processNumber) {
      const existing = await processRepository.findByProcessNumber(updateData.processNumber);
      if (existing && existing.id !== process.id) {
        throw new Error('Número de processo já cadastrado');
      }
    }

    const updatedProcess = await processRepository.update(id, updateData);

    await this.recordAudit(actor, AuditAction.PROCESS_UPDATED, updatedProcess.id, {
      changedFields: Object.keys(updateData),
      previousData: {
        clientId: process.clientId,
        processNumber: process.processNumber,
        title: process.title,
        description: process.description,
        court: process.court,
        instance: process.instance,
        subject: process.subject,
        status: process.status,
        value: process.value,
      },
      newData: {
        clientId: updatedProcess.clientId,
        processNumber: updatedProcess.processNumber,
        title: updatedProcess.title,
        description: updatedProcess.description,
        court: updatedProcess.court,
        instance: updatedProcess.instance,
        subject: updatedProcess.subject,
        status: updatedProcess.status,
        value: updatedProcess.value,
      },
    });

    return updatedProcess;
  }

  async updateStatus(actor, id, status) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    if (!canChangeProcessStatus(actor, process)) {
      throw new AppError('Acesso negado', 403);
    }

    const normalizedStatus = normalizeProcessStatus(status);

    const updatedProcess = await processRepository.update(id, { status: normalizedStatus });

    await this.recordAudit(actor, AuditAction.PROCESS_STATUS_CHANGED, updatedProcess.id, {
      previousStatus: process.status,
      newStatus: updatedProcess.status,
    });

    return updatedProcess;
  }

  async delete(actor, id) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    await this.recordAudit(actor, AuditAction.PROCESS_DELETED, process.id, {
      processNumber: process.processNumber,
      title: process.title,
      clientId: process.clientId,
      lawyerId: process.lawyerId,
    });

    return processRepository.delete(id);
  }

  async addDocument(actor, processId, { name, fileUrl, type }) {
    const process = await processRepository.findById(processId);
    if (!process) throw new Error('Processo não encontrado');

    if (!canUpdateProcess(actor, process)) {
      throw new AppError('Acesso negado', 403);
    }

    const document = await processRepository.addDocument({
      processId,
      name: normalizeRequiredString(name, 'Nome'),
      fileUrl: normalizeRequiredString(fileUrl, 'URL do arquivo'),
      type: normalizeOptionalString(type, 'Tipo'),
    });

    await this.recordAudit(actor, AuditAction.DOCUMENT_ADDED, process.id, {
      documentId: document.id,
      documentName: document.name,
      documentType: document.type,
    });

    return document;
  }

  async addUpdate(actor, processId, { title, description }) {
    const process = await processRepository.findById(processId);
    if (!process) throw new Error('Processo não encontrado');

    if (!canUpdateProcess(actor, process)) {
      throw new AppError('Acesso negado', 403);
    }

    const update = await processRepository.addUpdate({
      processId,
      title: normalizeRequiredString(title, 'Título'),
      description: normalizeRequiredString(description, 'Descrição'),
    });

    await this.recordAudit(actor, AuditAction.PROCESS_UPDATED, process.id, {
      changedFields: ['updates'],
      updateId: update.id,
      updateTitle: update.title,
    });

    return update;
  }

  async getLogs(actor, processId, pagination) {
    const process = await processRepository.findById(processId);
    if (!process) throw new Error('Processo não encontrado');

    if (!canViewProcess(actor, process)) {
      throw new AppError('Acesso negado', 403);
    }

    return auditService.listByEntity({
      entityType: AuditEntityType.PROCESS,
      entityId: process.id,
      page: pagination?.page,
      limit: pagination?.limit,
    });
  }
}

module.exports = new ProcessService();
