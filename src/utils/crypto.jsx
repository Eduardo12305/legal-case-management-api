const crypto = require('node:crypto');

function generateToken(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

module.exports = {
  generateToken,
  normalizeDigits,
};
