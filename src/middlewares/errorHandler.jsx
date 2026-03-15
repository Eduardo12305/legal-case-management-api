const AppError = require('../utils/appError.jsx');

const ERROR_STATUS_BY_MESSAGE = new Map([
  ['Token não fornecido', 401],
  ['Token inválido', 401],
  ['Usuário não autorizado', 401],
  ['Credenciais inválidas', 401],
  ['Conta desativada', 403],
  ['Acesso negado', 403],
  ['Permissão insuficiente', 403],
  ['Email não confirmado', 403],
  ['Você não pode inativar a própria conta', 400],
  ['Não é permitido inativar o último admin ativo', 400],
  ['Usuário não encontrado', 404],
  ['Cliente não encontrado', 404],
  ['Processo não encontrado', 404],
  ['Perfil de cliente não encontrado', 404],
  ['Destinatário não encontrado', 404],
]);

function resolveStatusCode(error) {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (ERROR_STATUS_BY_MESSAGE.has(error.message)) {
    return ERROR_STATUS_BY_MESSAGE.get(error.message);
  }

  return 500;
}

function errorHandler(error, req, res, next) {
  const statusCode = resolveStatusCode(error);
  const payload = {
    error: error.message || 'Erro interno do servidor',
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
