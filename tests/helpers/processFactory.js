const { prisma } = require('./database');

let processSequence = 1;

async function createProcess(overrides = {}) {
  if (!overrides.clientId) {
    throw new Error('clientId é obrigatório para criar processo de teste');
  }

  const process = await prisma.process.create({
    data: {
      clientId: overrides.clientId,
      lawyerId: overrides.lawyerId || null,
      processNumber: overrides.processNumber || `PROC-${processSequence++}`,
      title: overrides.title || 'Processo de teste',
      description: overrides.description || null,
      court: overrides.court || null,
      instance: overrides.instance || null,
      subject: overrides.subject || null,
      status: overrides.status || 'ACTIVE',
      value: overrides.value,
    },
    include: {
      client: {
        include: {
          user: true,
        },
      },
      documents: true,
      updates: true,
    },
  });

  return process;
}

module.exports = {
  createProcess,
};
