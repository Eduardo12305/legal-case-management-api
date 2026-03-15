const AppError = require('../utils/appError.jsx');
const {
  ensureEnumValue,
  isPlainObject,
  normalizeDigitString,
  normalizeOptionalDigitString,
  parsePaginationParams,
} = require('../utils/validation.jsx');

function requireObject(value, fieldName) {
  if (!isPlainObject(value)) {
    throw new AppError(`${fieldName} inválido`, 400);
  }

  return value;
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${fieldName} é obrigatório`, 400);
  }

  return value.trim();
}

function optionalString(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} inválido`, 400);
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function requireDigits(value, fieldName, options = {}) {
  try {
    return normalizeDigitString(value, fieldName, options);
  } catch (error) {
    throw new AppError(error.message, 400);
  }
}

function optionalDigits(value, fieldName, options = {}) {
  try {
    return normalizeOptionalDigitString(value, fieldName, options);
  } catch (error) {
    throw new AppError(error.message, 400);
  }
}

function enumValue(value, allowedValues, fieldName) {
  const validated = ensureEnumValue(value, allowedValues, fieldName);
  if (value !== undefined && !validated) {
    throw new AppError(`${fieldName} inválido`, 400);
  }

  return validated;
}

function pagination(query) {
  requireObject(query || {}, 'Query');
  return parsePaginationParams(query || {});
}

function idParams(params, fieldName = 'id') {
  requireObject(params, 'Parâmetros');
  return {
    [fieldName]: requireString(params[fieldName], fieldName),
  };
}

module.exports = {
  enumValue,
  idParams,
  optionalDigits,
  optionalString,
  pagination,
  requireDigits,
  requireObject,
  requireString,
};
