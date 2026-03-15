const request = require('supertest');
const app = require('../../src/app.jsx');
const { disconnectDatabase, resetDatabase } = require('../helpers/database');
const { getAuthHeader } = require('../helpers/auth');
const { createUser } = require('../helpers/userFactory');

describe('User routes', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('returns the authenticated user profile', async () => {
    const client = await createUser({
      email: 'client-profile@test.com',
      role: 'CLIENT',
    });

    const response = await request(app)
      .get('/api/users/profile')
      .set(await getAuthHeader(client));

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(client.email);
    expect(response.body.password).toBeUndefined();
  });

  it('allows admins to list users', async () => {
    const admin = await createUser({
      email: 'admin-users@test.com',
      role: 'ADMIN',
      createClient: false,
    });
    await createUser({ email: 'client-list@test.com', role: 'CLIENT' });

    const response = await request(app)
      .get('/api/users')
      .set(await getAuthHeader(admin));

    expect(response.statusCode).toBe(200);
    expect(response.body.users.length).toBeGreaterThanOrEqual(1);
    expect(response.body.users[0].password).toBeUndefined();
    expect(response.body.users.some((user) => user.id === admin.id)).toBe(false);
  });

  it('allows lawyers to list users', async () => {
    const lawyer = await createUser({
      email: 'lawyer-users@test.com',
      role: 'LAWYER',
      createClient: false,
    });
    await createUser({ email: 'client-lawyer-list@test.com', role: 'CLIENT' });
    await createUser({ email: 'staff-lawyer-list@test.com', role: 'STAFF', createClient: false });

    const response = await request(app)
      .get('/api/users')
      .set(await getAuthHeader(lawyer));

    expect(response.statusCode).toBe(200);
    expect(response.body.users.length).toBeGreaterThanOrEqual(2);
    expect(response.body.users.every((user) => ['STAFF', 'CLIENT'].includes(user.role))).toBe(true);
    expect(response.body.users.some((user) => user.id === lawyer.id)).toBe(false);
  });

  it('blocks clients from listing users', async () => {
    const client = await createUser({
      email: 'client-block@test.com',
      role: 'CLIENT',
    });

    const response = await request(app)
      .get('/api/users')
      .set(await getAuthHeader(client));

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });

  it('blocks staff from listing users', async () => {
    const staff = await createUser({
      email: 'staff-users@test.com',
      role: 'STAFF',
      createClient: false,
    });

    const response = await request(app)
      .get('/api/users')
      .set(await getAuthHeader(staff));

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });

  it('allows clients to update their own client profile', async () => {
    const client = await createUser({
      email: 'client-update@test.com',
      role: 'CLIENT',
      cpf: '11111111111',
    });

    const response = await request(app)
      .put('/api/users/profile/client')
      .set(await getAuthHeader(client))
      .send({
        profession: 'Desenvolvedor',
        city: 'Recife',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.profession).toBe('Desenvolvedor');
    expect(response.body.city).toBe('Recife');
  });

  it('blocks non-client users from updating client profile route', async () => {
    const lawyer = await createUser({
      email: 'lawyer-profile@test.com',
      role: 'LAWYER',
      createClient: false,
    });

    const response = await request(app)
      .put('/api/users/profile/client')
      .set(await getAuthHeader(lawyer))
      .send({
        profession: 'Advogado',
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Acesso negado');
  });

  it('allows admin to toggle user active status', async () => {
    const admin = await createUser({
      email: 'admin-toggle@test.com',
      role: 'ADMIN',
      createClient: false,
    });
    const client = await createUser({
      email: 'client-toggle@test.com',
      role: 'CLIENT',
    });

    const response = await request(app)
      .patch(`/api/users/${client.id}/toggle-active`)
      .set(await getAuthHeader(admin));

    expect(response.statusCode).toBe(200);
    expect(response.body.active).toBe(false);
  });

  it('blocks admin from disabling the own account', async () => {
    const admin = await createUser({
      email: 'admin-self-toggle@test.com',
      role: 'ADMIN',
      createClient: false,
    });

    const response = await request(app)
      .patch(`/api/users/${admin.id}/toggle-active`)
      .set(await getAuthHeader(admin));

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Você não pode inativar a própria conta');
  });

  it('blocks admin accounts from being toggled by another admin', async () => {
    const adminOne = await createUser({
      email: 'admin-one@test.com',
      role: 'ADMIN',
      createClient: false,
    });
    const adminTwo = await createUser({
      email: 'admin-two@test.com',
      role: 'ADMIN',
      createClient: false,
    });

    const firstDisable = await request(app)
      .patch(`/api/users/${adminTwo.id}/toggle-active`)
      .set(await getAuthHeader(adminOne));

    expect(firstDisable.statusCode).toBe(400);
    expect(firstDisable.body.error).toBe('Contas ADMIN não podem ser ativadas ou inativadas por esta rota');
  });
});
