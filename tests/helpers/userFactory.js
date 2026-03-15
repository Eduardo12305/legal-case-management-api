const bcrypt = require('bcryptjs');
const { prisma } = require('./database');

let sequence = 1;

async function createUser(overrides = {}) {
  const role = overrides.role || 'CLIENT';
  const plainPassword = overrides.password || '12345678';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const email = overrides.email || `user${sequence++}@test.com`;

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: overrides.name || 'Test User',
      phone: overrides.phone || null,
      role,
      active: overrides.active ?? true,
      isFirstLogin: overrides.isFirstLogin ?? false,
      emailVerified: overrides.emailVerified ?? true,
      emailVerifiedAt: overrides.emailVerified === false ? null : new Date(),
      client: role === 'CLIENT' && overrides.createClient !== false
        ? {
            create: {
              cpf: overrides.cpf || `0000000000${sequence}`,
            },
          }
        : undefined,
    },
    include: {
      client: true,
    },
  });

  return {
    ...user,
    plainPassword,
  };
}

module.exports = {
  createUser,
};
