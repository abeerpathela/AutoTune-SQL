const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('POST /api/queries/analyze', () => {
  beforeAll(async () => {
    // Setup test database if needed
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should analyze a valid query and return 200', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({ sql: 'SELECT 1' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.queryLog).toBeDefined();
  });

  it('should return 400 when sql field is missing', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should return 400 for invalid SQL syntax', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({ sql: 'SELEC * FROM users' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
  });

  it('should return 400 for dangerous SQL queries', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({ sql: 'DROP TABLE "QueryLog"' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('Dangerous SQL operations are not allowed.');
  });
});
