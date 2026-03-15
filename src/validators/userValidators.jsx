const { enumValue, idParams, optionalDigits, optionalString, pagination, requireDigits, requireObject, requireString } = require('./commonValidators.jsx');
const AppError = require('../utils/appError.jsx');
const { STAFF_GRANTABLE_PERMISSIONS } = require('../modules/access-control/permissions.jsx');

const ALLOWED_ROLES = ['ADMIN', 'LAWYER', 'STAFF', 'CLIENT'];

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
    result.phone = optionalDigits(data.phone, 'Telefone', { minLength: 10, maxLength: 11 });
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
    result.cpf = requireDigits(data.cpf, 'CPF', { exactLength: 11 });
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
    result.zipCode = optionalDigits(data.zipCode, 'CEP', { exactLength: 8 });
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
  setStaffPermissionsBody: (body) => {
    const data = requireObject(body, 'Body');

    if (!Array.isArray(data.permissions)) {
      throw new AppError('permissions deve ser uma lista', 400);
    }

    const normalizedPermissions = [...new Set(data.permissions.map((permission) => requireString(permission, 'Permissão')))];
    const invalidPermissions = normalizedPermissions.filter((permission) => !STAFF_GRANTABLE_PERMISSIONS.includes(permission));

    if (invalidPermissions.length > 0) {
      throw new AppError('Permissões inválidas para STAFF', 400, { invalidPermissions });
    }

    return {
      permissions: normalizedPermissions,
    };
  },
  toggleUserParams: (params) => idParams(params, 'id'),
  updateClientBody,
  updateProfileBody,
};
