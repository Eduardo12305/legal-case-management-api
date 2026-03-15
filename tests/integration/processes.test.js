const request = require('supertest');
const app = require('../../src/app.jsx');
const { disconnectDatabase, resetDatabase } = require('../helpers/database');
const { getAuthHeader } = require('../helpers/auth');
const { createProcess } = require('../helpers/processFactory');
const { createUser } = require('../helpers/userFactory');

describe('Process routes', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('allows a lawyer to create a process for a client and assigns ownership', async () => {
    const lawyer = await createUser({
      email: 'lawyer-process@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-process@test.com',
      role: 'CLIENT',
      cpf: '22222222222',
    });

    const response = await request(app)
      .post('/api/processes')
      .set(await getAuthHeader(lawyer))
      .send({
        clientId: client.client.id,
        processNumber: 'PROC-LAWYER-001',
        title: 'Processo jurídico',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.processNumber).toBe('PROC-LAWYER-001');
    expect(response.body.clientId).toBe(client.client.id);
    expect(response.body.lawyerId).toBe(lawyer.id);
  });

  it('creates a process from the form payload shape and allows fetching it afterwards', async () => {
    const lawyer = await createUser({
      email: 'lawyer-form@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-form@test.com',
      role: 'CLIENT',
      cpf: '99999999999',
    });

    const createResponse = await request(app)
      .post('/api/processes')
      .set(await getAuthHeader(lawyer))
      .send({
        clientId: client.client.id,
        number: 'PROC-FORM-001',
        title: 'Processo criado pelo formulario',
        description: 'Descricao inicial do formulario',
        status: 'ativo',
      });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.processNumber).toBe('PROC-FORM-001');
    expect(createResponse.body.title).toBe('Processo criado pelo formulario');
    expect(createResponse.body.description).toBe('Descricao inicial do formulario');
    expect(createResponse.body.status).toBe('ACTIVE');
    expect(createResponse.body.clientId).toBe(client.client.id);
    expect(createResponse.body.lawyerId).toBe(lawyer.id);

    const processId = createResponse.body.id;

    const getByIdResponse = await request(app)
      .get(`/api/processes/${processId}`)
      .set(await getAuthHeader(lawyer));

    expect(getByIdResponse.statusCode).toBe(200);
    expect(getByIdResponse.body.id).toBe(processId);
    expect(getByIdResponse.body.processNumber).toBe('PROC-FORM-001');

    const getByClientResponse = await request(app)
      .get(`/api/processes/client/${client.client.id}`)
      .set(await getAuthHeader(lawyer));

    expect(getByClientResponse.statusCode).toBe(200);
    expect(getByClientResponse.body.processes).toHaveLength(1);
    expect(getByClientResponse.body.processes[0].id).toBe(processId);
    expect(getByClientResponse.body.processes[0].processNumber).toBe('PROC-FORM-001');
  });

  it('blocks admin from creating a process', async () => {
    const admin = await createUser({
      email: 'admin-process@test.com',
      role: 'ADMIN',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-admin-process@test.com',
      role: 'CLIENT',
      cpf: '22222222222',
    });

    const response = await request(app)
      .post('/api/processes')
      .set(await getAuthHeader(admin))
      .send({
        clientId: client.client.id,
        processNumber: 'PROC-ADMIN-001',
        title: 'Processo administrativo',
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });

  it('blocks clients from listing all processes', async () => {
    const client = await createUser({
      email: 'client-list-processes@test.com',
      role: 'CLIENT',
    });

    const response = await request(app)
      .get('/api/processes')
      .set(await getAuthHeader(client));

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });

  it('blocks staff from creating a process', async () => {
    const staff = await createUser({
      email: 'staff-process@test.com',
      role: 'STAFF',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-staff-process@test.com',
      role: 'CLIENT',
      cpf: '23232323232',
    });

    const response = await request(app)
      .post('/api/processes')
      .set(await getAuthHeader(staff))
      .send({
        clientId: client.client.id,
        processNumber: 'PROC-STAFF-001',
        title: 'Processo de staff',
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });

  it('returns only processes assigned to the authenticated lawyer on list route', async () => {
    const lawyer = await createUser({
      email: 'lawyer-own-list@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const otherLawyer = await createUser({
      email: 'lawyer-not-own-list@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const clientA = await createUser({
      email: 'client-lawyer-a@test.com',
      role: 'CLIENT',
      cpf: '12121212121',
    });
    const clientB = await createUser({
      email: 'client-lawyer-b@test.com',
      role: 'CLIENT',
      cpf: '34343434343',
    });

    await createProcess({
      clientId: clientA.client.id,
      lawyerId: lawyer.id,
      processNumber: 'PROC-LIST-001',
      title: 'Processo do advogado logado',
    });
    await createProcess({
      clientId: clientB.client.id,
      lawyerId: otherLawyer.id,
      processNumber: 'PROC-LIST-002',
      title: 'Processo de outro advogado',
    });

    const response = await request(app)
      .get('/api/processes')
      .set(await getAuthHeader(lawyer));

    expect(response.statusCode).toBe(200);
    expect(response.body.processes).toHaveLength(1);
    expect(response.body.processes[0].processNumber).toBe('PROC-LIST-001');
  });

  it('returns only the authenticated client processes on /my', async () => {
    const clientA = await createUser({
      email: 'client-a@test.com',
      role: 'CLIENT',
      cpf: '33333333333',
    });
    const clientB = await createUser({
      email: 'client-b@test.com',
      role: 'CLIENT',
      cpf: '44444444444',
    });

    const lawyer = await createUser({
      email: 'lawyer-list-own@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const otherLawyer = await createUser({
      email: 'lawyer-other@test.com',
      role: 'LAWYER',
      createClient: false,
    });

    await createProcess({
      clientId: clientA.client.id,
      lawyerId: lawyer.id,
      processNumber: 'PROC-A-001',
      title: 'Processo A',
    });
    await createProcess({
      clientId: clientB.client.id,
      lawyerId: otherLawyer.id,
      processNumber: 'PROC-B-001',
      title: 'Processo B',
    });

    const response = await request(app)
      .get('/api/processes/my')
      .set(await getAuthHeader(clientA));

    expect(response.statusCode).toBe(200);
    expect(response.body.processes).toHaveLength(1);
    expect(response.body.processes[0].processNumber).toBe('PROC-A-001');
  });

  it('allows a client to access only its own process details', async () => {
    const owner = await createUser({
      email: 'owner@test.com',
      role: 'CLIENT',
      cpf: '55555555555',
    });
    const otherClient = await createUser({
      email: 'other@test.com',
      role: 'CLIENT',
      cpf: '66666666666',
    });

    const process = await createProcess({
      clientId: owner.client.id,
      lawyerId: null,
      processNumber: 'PROC-OWNER-001',
      title: 'Processo do titular',
    });

    const ownResponse = await request(app)
      .get(`/api/processes/${process.id}`)
      .set(await getAuthHeader(owner));

    expect(ownResponse.statusCode).toBe(200);
    expect(ownResponse.body.id).toBe(process.id);

    const forbiddenResponse = await request(app)
      .get(`/api/processes/${process.id}`)
      .set(await getAuthHeader(otherClient));

    expect(forbiddenResponse.statusCode).toBe(403);
    expect(forbiddenResponse.body.error).toBe('Acesso negado');
  });

  it('allows responsible lawyer to update process status', async () => {
    const lawyer = await createUser({
      email: 'lawyer-status@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-status@test.com',
      role: 'CLIENT',
      cpf: '77777777777',
    });
    const process = await createProcess({
      clientId: client.client.id,
      lawyerId: lawyer.id,
      processNumber: 'PROC-STATUS-001',
      title: 'Processo status',
    });

    const response = await request(app)
      .patch(`/api/processes/${process.id}/status`)
      .set(await getAuthHeader(lawyer))
      .send({
        status: 'CLOSED',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('CLOSED');
  });

  it('records audit logs for process changes and returns them with actor data', async () => {
    const lawyer = await createUser({
      email: 'lawyer-audit@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-audit@test.com',
      role: 'CLIENT',
      cpf: '91919191919',
    });

    const process = await createProcess({
      clientId: client.client.id,
      lawyerId: lawyer.id,
      processNumber: 'PROC-AUDIT-001',
      title: 'Processo auditado',
    });

    const updateResponse = await request(app)
      .put(`/api/processes/${process.id}`)
      .set(await getAuthHeader(lawyer))
      .send({
        title: 'Processo auditado atualizado',
        description: 'Nova descricao',
      });

    expect(updateResponse.statusCode).toBe(200);

    const logsResponse = await request(app)
      .get(`/api/processes/${process.id}/logs`)
      .set(await getAuthHeader(lawyer));

    expect(logsResponse.statusCode).toBe(200);
    expect(logsResponse.body.logs.length).toBeGreaterThanOrEqual(1);
    expect(logsResponse.body.logs[0].actor.id).toBe(lawyer.id);
    expect(logsResponse.body.logs[0].action).toBe('PROCESS_UPDATED');
    expect(logsResponse.body.logs[0].entityId).toBe(process.id);
  });

  it('blocks a lawyer from updating another lawyer process status', async () => {
    const ownerLawyer = await createUser({
      email: 'owner-lawyer@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const otherLawyer = await createUser({
      email: 'other-lawyer@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-owner-lawyer@test.com',
      role: 'CLIENT',
      cpf: '88888888888',
    });
    const process = await createProcess({
      clientId: client.client.id,
      lawyerId: ownerLawyer.id,
      processNumber: 'PROC-LOCK-001',
      title: 'Processo protegido',
    });

    const response = await request(app)
      .patch(`/api/processes/${process.id}/status`)
      .set(await getAuthHeader(otherLawyer))
      .send({
        status: 'CLOSED',
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });
});
