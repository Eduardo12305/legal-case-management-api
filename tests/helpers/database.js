const prisma = require('../../src/database/prisma.jsx');

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "email_verification_tokens",
      "registration_invites",
      "user_permissions",
      "process_assignments",
      "process_versions",
      "legal_events",
      "audit_logs",
      "chat_messages",
      "documents",
      "process_updates",
      "processes",
      "clients",
      "users"
    RESTART IDENTITY CASCADE
  `);
}

async function disconnectDatabase() {
  await prisma.$disconnect();
}

module.exports = {
  disconnectDatabase,
  prisma,
  resetDatabase,
};
