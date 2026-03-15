const request = require('supertest');
const app = require('../../src/app.jsx');
const { disconnectDatabase, db, resetDatabase } = require('../helpers/database');
const { createUser } = require('../helpers/userFactory');
const { randomUUID } = require('crypto');

describe('Auth routes', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('registers a client successfully', async () => {
    await db.execute(
      `INSERT INTO registration_invites (id, email, role, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [randomUUID(), 'client@test.com', 'CLIENT', 'invite-client-test', new Date(Date.now() + 60 * 60 * 1000)],
    );

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'client@test.com',
        password: '12345678',
        name: 'Client Test',
        role: 'CLIENT',
        clientData: {
          inviteToken: 'invite-client-test',
          cpf: '12345678901',
        },
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.token).toBeUndefined();
    expect(response.body.verificationToken).toBeUndefined();
    expect(response.body.message).toContain('Confirme o email');
    expect(response.body.user.email).toBe('client@test.com');
    expect(response.body.user.client.cpf).toBe('12345678901');
  });

  it('rejects login with invalid credentials', async () => {
    await createUser({
      email: 'admin@test.com',
      password: '12345678',
      role: 'ADMIN',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'wrong-password',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Credenciais inválidas');
  });

  it('requests password change on first login users', async () => {
    const user = await createUser({
      email: 'firstlogin@test.com',
      password: '12345678',
      role: 'ADMIN',
      isFirstLogin: true,
      createClient: false,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.plainPassword,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.requiresPasswordChange).toBe(true);
    expect(response.body.userId).toBe(user.id);
  });

  it('allows clients to login with CPF', async () => {
    const client = await createUser({
      email: 'cpf-login@test.com',
      password: '12345678',
      role: 'CLIENT',
      cpf: '12345678901',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: client.client.cpf,
        password: client.plainPassword,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe(client.email);
  });
});
