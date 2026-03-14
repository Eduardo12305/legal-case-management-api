const AppError = require('../utils/appError.jsx');
const {
  enumValue,
  optionalString,
  requireObject,
  requireString,
} = require('./commonValidators.jsx');

const ALLOWED_ROLES = ['ADMIN', 'LAWYER', 'CLIENT'];

function validateClientData(clientData) {
  const data = requireObject(clientData, 'Dados do cliente');

  return {
    cpf: requireString(data.cpf, 'CPF'),
    rg: optionalString(data.rg, 'RG'),
    birthDate: data.birthDate,
    profession: optionalString(data.profession, 'Profissão'),
    nationality: optionalString(data.nationality, 'Nacionalidade'),
    maritalStatus: optionalString(data.maritalStatus, 'Estado civil'),
    address: optionalString(data.address, 'Endereço'),
    city: optionalString(data.city, 'Cidade'),
    state: optionalString(data.state, 'Estado'),
    zipCode: optionalString(data.zipCode, 'CEP'),
    notes: optionalString(data.notes, 'Observações'),
  };
}

function registerBody(body) {
  const data = requireObject(body, 'Body');
  const role = enumValue(data.role, ALLOWED_ROLES, 'Perfil') || 'CLIENT';

  if (role === 'CLIENT' && !data.clientData) {
    throw new AppError('CPF é obrigatório para clientes', 400);
  }

  return {
    email: requireString(data.email, 'Email'),
    password: requireString(data.password, 'Senha'),
    name: requireString(data.name, 'Nome'),
    phone: optionalString(data.phone, 'Telefone'),
    role,
    clientData: role === 'CLIENT' ? validateClientData(data.clientData) : undefined,
  };
}

function loginBody(body) {
  const data = requireObject(body, 'Body');

  return {
    email: requireString(data.email, 'Email'),
    password: requireString(data.password, 'Senha'),
  };
}

module.exports = {
  loginBody,
  registerBody,
};
