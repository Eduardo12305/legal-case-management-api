const request = require('supertest');
const app = require('../../src/app.jsx');

describe('GET /api/health', () => {
  it('returns application health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeTruthy();
  });
});
