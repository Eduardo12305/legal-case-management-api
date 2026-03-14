const processRepository = require('../repositories/processRepository');
const clientRepository = require('../repositories/clientRepository');
const {
  ensureEnumValue,
  normalizeDecimal,
  normalizeOptionalString,
  normalizeRequiredString,
} = require('../utils/validation');

const ALLOWED_PROCESS_STATUS = ['ACTIVE', 'ARCHIVED', 'SUSPENDED', 'CLOSED', 'WON', 'LOST'];

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
    normalizedData.status = ensureEnumValue(data.status, ALLOWED_PROCESS_STATUS, 'Status');
  }

  return normalizedData;
}

class ProcessService {
  async create({ clientId, lawyerId, processNumber, title, description, court, instance, subject, value }) {
    const payload = normalizeProcessPayload({
      clientId,
      lawyerId,
      processNumber,
      title,
      description,
      court,
      instance,
      subject,
      value,
    });

    const client = await clientRepository.findById(payload.clientId);
    if (!client) throw new Error('Cliente não encontrado');

    const existing = await processRepository.findByProcessNumber(payload.processNumber);
    if (existing) throw new Error('Número de processo já cadastrado');

    return processRepository.create(payload);
  }

  async getById(id, requester) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    if (requester?.role === 'CLIENT') {
      const client = await clientRepository.findByUserId(requester.id);
      if (!client || process.clientId !== client.id) {
        throw new Error('Acesso negado');
      }
    }

    return process;
  }

  async getByClientId(clientId, pagination) {
    const client = await clientRepository.findById(clientId);
    if (!client) throw new Error('Cliente não encontrado');

    return processRepository.findByClientId(clientId, pagination);
  }

  async getMyProcesses(userId, pagination) {
    const client = await clientRepository.findByUserId(userId);
    if (!client) throw new Error('Perfil de cliente não encontrado');
    return processRepository.findByClientId(client.id, pagination);
  }

  async listAll(filters) {
    const normalizedStatus = ensureEnumValue(filters.status, ALLOWED_PROCESS_STATUS, 'Status');
    return processRepository.findAll({ ...filters, status: normalizedStatus });
  }

  async update(id, data) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    const updateData = normalizeProcessPayload(data, { partial: true });

    if (updateData.clientId && updateData.clientId !== process.clientId) {
      const client = await clientRepository.findById(updateData.clientId);
      if (!client) throw new Error('Cliente não encontrado');
    }

    if (updateData.processNumber && updateData.processNumber !== process.processNumber) {
      const existing = await processRepository.findByProcessNumber(updateData.processNumber);
      if (existing && existing.id !== process.id) {
        throw new Error('Número de processo já cadastrado');
      }
    }

    return processRepository.update(id, updateData);
  }

  async updateStatus(id, status) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    const normalizedStatus = ensureEnumValue(status, ALLOWED_PROCESS_STATUS, 'Status');

    return processRepository.update(id, { status: normalizedStatus });
  }

  async delete(id) {
    const process = await processRepository.findById(id);
    if (!process) throw new Error('Processo não encontrado');

    return processRepository.delete(id);
  }

  async addDocument(processId, { name, fileUrl, type }) {
    const process = await processRepository.findById(processId);
    if (!process) throw new Error('Processo não encontrado');

    return processRepository.addDocument({
      processId,
      name: normalizeRequiredString(name, 'Nome'),
      fileUrl: normalizeRequiredString(fileUrl, 'URL do arquivo'),
      type: normalizeOptionalString(type, 'Tipo'),
    });
  }

  async addUpdate(processId, { title, description }) {
    const process = await processRepository.findById(processId);
    if (!process) throw new Error('Processo não encontrado');

    return processRepository.addUpdate({
      processId,
      title: normalizeRequiredString(title, 'Título'),
      description: normalizeRequiredString(description, 'Descrição'),
    });
  }
}

module.exports = new ProcessService();
