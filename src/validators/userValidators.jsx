const { enumValue, idParams, optionalString, pagination, requireObject, requireString } = require('./commonValidators.jsx');

const ALLOWED_ROLES = ['ADMIN', 'LAWYER', 'CLIENT'];

function updateProfileBody(body) {
  const data = requireObject(body, 'Body');
  const result = {};

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    result.name = requireString(data.name, 'Nome');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'email')) {
    result.email = requireString(data.email, 'Email');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
    result.phone = optionalString(data.phone, 'Telefone');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'avatarUrl')) {
    result.avatarUrl = optionalString(data.avatarUrl, 'Avatar');
  }

  return result;
}

function updateClientBody(body) {
  const data = requireObject(body, 'Body');
  const result = {};

  if (Object.prototype.hasOwnProperty.call(data, 'cpf')) {
    result.cpf = requireString(data.cpf, 'CPF');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'rg')) {
    result.rg = optionalString(data.rg, 'RG');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'birthDate')) {
    result.birthDate = data.birthDate;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'profession')) {
    result.profession = optionalString(data.profession, 'Profissão');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'nationality')) {
    result.nationality = optionalString(data.nationality, 'Nacionalidade');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'maritalStatus')) {
    result.maritalStatus = optionalString(data.maritalStatus, 'Estado civil');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'address')) {
    result.address = optionalString(data.address, 'Endereço');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'city')) {
    result.city = optionalString(data.city, 'Cidade');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'state')) {
    result.state = optionalString(data.state, 'Estado');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'zipCode')) {
    result.zipCode = optionalString(data.zipCode, 'CEP');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'notes')) {
    result.notes = optionalString(data.notes, 'Observações');
  }

  return result;
}

function changePasswordBody(body) {
  const data = requireObject(body, 'Body');

  return {
    currentPassword: requireString(data.currentPassword, 'Senha atual'),
    newPassword: requireString(data.newPassword, 'Nova senha'),
  };
}

function listUsersQuery(query) {
  const parsedPagination = pagination(query);

  return {
    ...parsedPagination,
    role: enumValue(query.role, ALLOWED_ROLES, 'Perfil'),
  };
}

module.exports = {
  changePasswordBody,
  listUsersQuery,
  toggleUserParams: (params) => idParams(params, 'id'),
  updateClientBody,
  updateProfileBody,
};
