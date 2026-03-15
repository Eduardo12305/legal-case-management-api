require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function upsertUser({ email, password, name, role, phone, clientData }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      phone: phone || null,
      role,
      active: true,
      isFirstLogin: false,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      password: hashedPassword,
    },
    create: {
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      role,
      active: true,
      isFirstLogin: false,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      client: clientData
        ? {
            create: clientData,
          }
        : undefined,
    },
    include: {
      client: true,
      userPermissions: true,
    },
  });
}

async function syncStaffPermissions(userId, permissions) {
  await prisma.userPermission.deleteMany({
    where: { userId },
  });

  if (permissions.length === 0) return;

  await prisma.userPermission.createMany({
    data: permissions.map((permission) => ({
      userId,
      permission,
    })),
  });
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
    await prisma.$disconnect();
  });
