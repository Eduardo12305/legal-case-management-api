const db = require('../../src/database/mysql.jsx');

async function resetDatabase() {
  await db.execute('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'email_verification_tokens',
    'registration_invites',
    'user_permissions',
    'process_assignments',
    'process_versions',
    'legal_events',
    'audit_logs',
    'chat_messages',
    'documents',
    'process_updates',
    'processes',
    'clients',
    'users',
  ]) {
    await db.execute(`TRUNCATE TABLE ${table}`);
  }
  await db.execute('SET FOREIGN_KEY_CHECKS = 1');
}

async function disconnectDatabase() {
  // Mantemos o pool aberto durante a suíte inteira para evitar reuso de conexão encerrada
  // entre arquivos de teste rodados em sequência.
}

module.exports = {
  disconnectDatabase,
  db,
  resetDatabase,
};
