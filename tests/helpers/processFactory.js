const { randomUUID } = require('crypto');
const { db } = require('./database');

let processSequence = 1;

async function createProcess(overrides = {}) {
  if (!overrides.clientId) {
    throw new Error('clientId é obrigatório para criar processo de teste');
  }

  const processId = randomUUID();
  await db.execute(
    `INSERT INTO processes (
      id, client_id, lawyer_id, process_number, title, description, court,
      instance, subject, status, value, start_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
    [
      processId,
      overrides.clientId,
      overrides.lawyerId || null,
      overrides.processNumber || `PROC-${processSequence++}`,
      overrides.title || 'Processo de teste',
      overrides.description || null,
      overrides.court || null,
      overrides.instance || null,
      overrides.subject || null,
      overrides.status || 'ACTIVE',
      overrides.value ?? null,
    ],
  );

  return db.one(
    `SELECT id, client_id AS clientId, lawyer_id AS lawyerId, process_number AS processNumber,
            title, description, court, instance, subject, status, value
     FROM processes WHERE id = ? LIMIT 1`,
    [processId],
  );
}

module.exports = {
  createProcess,
};
