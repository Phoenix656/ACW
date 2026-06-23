const request = require('supertest');
const app = require('../server'); // server.js exports the Express app

// Note: These integration tests assume a test database is configured via DATABASE_URL env var.
// The test suite will run against that DB. Ensure the DB is empty or contains known fixtures.

describe('GET /api/documents', () => {
  test('should respond with JSON array', async () => {
    const response = await request(app).get('/api/documents').expect('Content-Type', /json/).expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
