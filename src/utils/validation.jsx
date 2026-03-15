function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeDigitString(value, fieldName, { exactLength, minLength, maxLength } = {}) {
  if (!isNonEmptyString(value)) {
    throw new Error(`${fieldName} é obrigatório`);
  }

  const digits = String(value).replace(/\D/g, '');
  if (!digits) {
    throw new Error(`${fieldName} inválido`);
  }

  if (exactLength !== undefined && digits.length !== exactLength) {
    throw new Error(`${fieldName} inválido`);
  }

  if (minLength !== undefined && digits.length < minLength) {
    throw new Error(`${fieldName} inválido`);
  }

  if (maxLength !== undefined && digits.length > maxLength) {
    throw new Error(`${fieldName} inválido`);
  }

  return digits;
}

function normalizeOptionalDigitString(value, fieldName, options = {}) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  return normalizeDigitString(value, fieldName, options);
}

function normalizeOptionalString(value, fieldName = 'Campo') {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} inválido`);
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeRequiredString(value, fieldName) {
  if (!isNonEmptyString(value)) {
    throw new Error(`${fieldName} é obrigatório`);
  }

  return value.trim();
}

function ensureEnumValue(value, allowedValues, fieldName) {
  if (value === undefined) return undefined;
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} inválido`);
  }

  return value;
}

function normalizeDate(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${fieldName} inválida`);
  }

  return parsedDate;
}

function normalizeDecimal(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsedNumber = Number(value);
  if (!Number.isFinite(parsedNumber) || parsedNumber < 0) {
    throw new Error(`${fieldName} inválido`);
  }

  return parsedNumber;
}

function parsePaginationParams({ page, limit }, defaults = {}) {
  const defaultPage = defaults.page || 1;
  const defaultLimit = defaults.limit || 20;
  const maxLimit = defaults.maxLimit || 100;

  const parsedPage = page === undefined ? defaultPage : Number(page);
  const parsedLimit = limit === undefined ? defaultLimit : Number(limit);

  if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
    throw new Error('Parâmetro page inválido');
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > maxLimit) {
    throw new Error(`Parâmetro limit inválido (máximo ${maxLimit})`);
  }

  return { page: parsedPage, limit: parsedLimit };
}

module.exports = {
  ensureEnumValue,
  isNonEmptyString,
  isPlainObject,
  normalizeDate,
  normalizeDecimal,
  normalizeDigitString,
  normalizeOptionalString,
  normalizeOptionalDigitString,
  normalizeRequiredString,
  parsePaginationParams,
};
