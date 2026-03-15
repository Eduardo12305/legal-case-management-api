const { enumValue, idParams, optionalString, pagination, requireObject, requireString } = require('./commonValidators.jsx');

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

function normalizeStatusInput(status) {
  if (status === undefined) {
    return undefined;
  }

  if (typeof status !== 'string') {
    return status;
  }

  const trimmedStatus = status.trim();
  if (!trimmedStatus) {
    return undefined;
  }

  return PROCESS_STATUS_ALIASES[trimmedStatus.toLowerCase()] || trimmedStatus.toUpperCase();
}

function createProcessBody(body) {
  const data = requireObject(body, 'Body');
  const processNumber = typeof data.processNumber === 'string' && data.processNumber.trim()
    ? data.processNumber
    : data.number;

  return {
    clientId: requireString(data.clientId, 'ClientId'),
    lawyerId: optionalString(data.lawyerId, 'Advogado'),
    processNumber: requireString(processNumber, 'Número do processo'),
    title: requireString(data.title, 'Título'),
    description: optionalString(data.description, 'Descrição'),
    court: optionalString(data.court, 'Tribunal'),
    instance: optionalString(data.instance, 'Instância'),
    subject: optionalString(data.subject, 'Assunto'),
    value: data.value,
    status: normalizeStatusInput(data.status),
  };
}

function updateProcessBody(body) {
  const data = requireObject(body, 'Body');
  const result = {};

  if (Object.prototype.hasOwnProperty.call(data, 'clientId')) {
    result.clientId = requireString(data.clientId, 'ClientId');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'lawyerId')) {
    result.lawyerId = optionalString(data.lawyerId, 'Advogado');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'processNumber')) {
    result.processNumber = requireString(data.processNumber, 'Número do processo');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'title')) {
    result.title = requireString(data.title, 'Título');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'description')) {
    result.description = optionalString(data.description, 'Descrição');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'court')) {
    result.court = optionalString(data.court, 'Tribunal');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'instance')) {
    result.instance = optionalString(data.instance, 'Instância');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'subject')) {
    result.subject = optionalString(data.subject, 'Assunto');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'value')) {
    result.value = data.value;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'status')) {
    result.status = enumValue(normalizeStatusInput(data.status), ALLOWED_PROCESS_STATUS, 'Status');
  }

  return result;
}

function updateStatusBody(body) {
  const data = requireObject(body, 'Body');

  return {
    status: enumValue(normalizeStatusInput(requireString(data.status, 'Status')), ALLOWED_PROCESS_STATUS, 'Status'),
  };
}

function addDocumentBody(body) {
  const data = requireObject(body, 'Body');

  return {
    name: requireString(data.name, 'Nome'),
    fileUrl: requireString(data.fileUrl, 'URL do arquivo'),
    type: optionalString(data.type, 'Tipo'),
  };
}

function addUpdateBody(body) {
  const data = requireObject(body, 'Body');

  return {
    title: requireString(data.title, 'Título'),
    description: requireString(data.description, 'Descrição'),
  };
}

function listAllQuery(query) {
  const parsedPagination = pagination(query);

  return {
    ...parsedPagination,
    status: enumValue(normalizeStatusInput(query.status), ALLOWED_PROCESS_STATUS, 'Status'),
  };
}

module.exports = {
  addDocumentBody,
  addUpdateBody,
  createProcessBody,
  getByClientParams: (params) => idParams(params, 'clientId'),
  processIdParams: (params) => idParams(params, 'id'),
  processListQuery: pagination,
  processStatusQuery: listAllQuery,
  updateProcessBody,
  updateStatusBody,
};
