const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('POST /api/queries/analyze', () => {
  beforeAll(async () => {
    // Optional: Clear QueryLog before tests
    await prisma.queryLog.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should classify a valid Performance query correctly', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({ sql: 'SELECT * FROM users WHERE id = 1' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.analysis.errorCategory).toBe('Performance');
    expect(response.body.data.analysis.isSyntaxValid).toBe(true);
  });

  it('should detect invalid Syntax and classify it correctly', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({ sql: 'SELEC * FROM users' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.errorCategory).toBe('Syntax');
    expect(response.body.message).toBeDefined();
  });

  it('should detect suspicious Logic joins and classify them', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({ sql: 'SELECT * FROM users u JOIN orders o ON u.id = o.total' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.analysis.errorCategory).toBe('Logic');
    expect(response.body.data.analysis.isSyntaxValid).toBe(true);
    expect(response.body.data.analysis.logicFlaws.length).toBeGreaterThan(0);
  });

  it('should return 400 when sql field is missing', async () => {
    const response = await request(app)
      .post('/api/queries/analyze')
      .send({});

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
