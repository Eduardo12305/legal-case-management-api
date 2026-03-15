require('dotenv').config();

const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const db = require('../src/database/mysql.jsx');

async function upsertUser({ email, password, name, role, phone, clientData }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await db.one('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  const userId = existing?.id || randomUUID();

  if (existing) {
    await db.execute(
      `UPDATE users
       SET name = ?, phone = ?, role = ?, active = 1, is_first_login = 0,
           email_verified = 1, email_verified_at = NOW(), password = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, phone || null, role, hashedPassword, userId],
    );
  } else {
    await db.execute(
      `INSERT INTO users (
        id, email, password, name, phone, role, active, is_first_login,
        email_verified, email_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1, NOW(), NOW(), NOW())`,
      [userId, email, hashedPassword, name, phone || null, role],
    );
  }

  if (clientData) {
    const existingClient = await db.one('SELECT id FROM clients WHERE user_id = ? LIMIT 1', [userId]);
    if (existingClient) {
      await db.execute(
        `UPDATE clients SET cpf = ?, city = ?, updated_at = NOW() WHERE id = ?`,
        [clientData.cpf, clientData.city || null, existingClient.id],
      );
    } else {
      await db.execute(
        `INSERT INTO clients (id, user_id, cpf, city, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [randomUUID(), userId, clientData.cpf, clientData.city || null],
      );
    }
  }

  return db.one(
    `SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );
}

async function syncStaffPermissions(userId, permissions) {
  await db.execute('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

  if (permissions.length === 0) return;

  for (const permission of permissions) {
    await db.execute(
      `INSERT INTO user_permissions (id, user_id, permission, created_at)
       VALUES (?, ?, ?, NOW())`,
      [randomUUID(), userId, permission],
    );
  }
}

async function main() {
  const admin = await upsertUser({
    email: 'admin@advon.local',
    password: 'Admin@123',
    name: 'Administrador Advon',
    role: 'ADMIN',
  });

  const lawyer = await upsertUser({
    email: 'lawyer@advon.local',
    password: 'Lawyer@123',
    name: 'Advogado Advon',
    role: 'LAWYER',
  });

  const staff = await upsertUser({
    email: 'staff@advon.local',
    password: 'Staff@123',
    name: 'Assistente Advon',
    role: 'STAFF',
  });

  const client = await upsertUser({
    email: 'client@advon.local',
    password: 'Client@123',
    name: 'Cliente Advon',
    role: 'CLIENT',
    clientData: {
      cpf: '99999999999',
      city: 'Recife',
    },
  });

  await syncStaffPermissions(staff.id, ['CLIENT_CREATE', 'CLIENT_VIEW', 'DOCUMENT_UPLOAD']);

  console.log('Seed concluído com sucesso.');
  console.log('Usuários iniciais:');
  console.log(`ADMIN  -> ${admin.email} / Admin@123`);
  console.log(`LAWYER -> ${lawyer.email} / Lawyer@123`);
  console.log(`STAFF  -> ${staff.email} / Staff@123`);
  console.log(`CLIENT -> ${client.email} / Client@123`);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
