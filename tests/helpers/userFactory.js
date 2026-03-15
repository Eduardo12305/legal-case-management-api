const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { db } = require('./database');

let sequence = 1;

async function createUser(overrides = {}) {
  const role = overrides.role || 'CLIENT';
  const plainPassword = overrides.password || '12345678';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const email = overrides.email || `user${sequence++}@test.com`;

  const userId = randomUUID();
  await db.execute(
    `INSERT INTO users (
      id, email, password, name, phone, role, active, is_first_login,
      email_verified, email_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      userId,
      email,
      hashedPassword,
      overrides.name || 'Test User',
      overrides.phone || null,
      role,
      overrides.active ?? true,
      overrides.isFirstLogin ?? false,
      overrides.emailVerified ?? true,
      overrides.emailVerified === false ? null : new Date(),
    ],
  );

  let client = null;
  if (role === 'CLIENT' && overrides.createClient !== false) {
    const clientId = randomUUID();
    await db.execute(
      `INSERT INTO clients (id, user_id, cpf, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [clientId, userId, overrides.cpf || `0000000000${sequence}`],
    );
    client = await db.one('SELECT id, user_id AS userId, cpf FROM clients WHERE id = ? LIMIT 1', [clientId]);
  }

  const user = await db.one(
    `SELECT id, email, password, name, phone, role, active, is_first_login AS isFirstLogin,
            email_verified AS emailVerified, email_verified_at AS emailVerifiedAt
     FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );

  return {
    ...user,
    client,
    plainPassword,
  };
}

module.exports = {
  createUser,
};
