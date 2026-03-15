const request = require('supertest');
const app = require('../../src/app.jsx');

async function loginAs(user) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: user.plainPassword,
    });

  return response;
}

async function getAuthHeader(user) {
  const response = await loginAs(user);

  if (!response.body.token) {
    throw new Error(`Falha ao autenticar usuário de teste: ${response.body.error || 'sem token'}`);
  }

  return {
    Authorization: `Bearer ${response.body.token}`,
  };
}

module.exports = {
  getAuthHeader,
  loginAs,
};
