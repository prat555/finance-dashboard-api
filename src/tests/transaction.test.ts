import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';

// ── Helpers ───────────────────────────────────────────────────────────────────
const createAndLoginUser = async (role: 'ADMIN' | 'ANALYST' | 'VIEWER', suffix = '') => {
  const email = `${role.toLowerCase()}${suffix}@test.com`;
  await request(app).post('/api/auth/register').send({
    name: `${role} User`,
    email,
    password: 'password123',
    role,
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.data.token as string;
};

const validTransaction = {
  amount: 5000,
  type: 'INCOME',
  category: 'Salary',
  date: new Date().toISOString(),
  notes: 'Test entry',
};

// ── Cleanup ───────────────────────────────────────────────────────────────────
beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('POST /api/transactions', () => {
  it('ADMIN can create a transaction', async () => {
    const token = await createAndLoginUser('ADMIN');
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTransaction);

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe('5000');
    expect(res.body.data.type).toBe('INCOME');
  });

  it('VIEWER cannot create a transaction', async () => {
    const token = await createAndLoginUser('VIEWER', '2');
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTransaction);

    expect(res.status).toBe(403);
  });

  it('ANALYST cannot create a transaction', async () => {
    const token = await createAndLoginUser('ANALYST', '3');
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTransaction);

    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid amount', async () => {
    const token = await createAndLoginUser('ADMIN', '4');
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validTransaction, amount: -100 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid type', async () => {
    const token = await createAndLoginUser('ADMIN', '5');
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validTransaction, type: 'TRANSFER' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/transactions', () => {
  it('VIEWER can list transactions', async () => {
    const adminToken = await createAndLoginUser('ADMIN');
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validTransaction);

    const viewerToken = await createAndLoginUser('VIEWER', '2');
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('supports filtering by type', async () => {
    const token = await createAndLoginUser('ADMIN');
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTransaction);
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validTransaction, type: 'EXPENSE', category: 'Rent' });

    const res = await request(app)
      .get('/api/transactions?type=INCOME')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((t: { type: string }) => t.type === 'INCOME')).toBe(true);
  });
});

describe('DELETE /api/transactions/:id', () => {
  it('ADMIN can soft delete a transaction', async () => {
    const token = await createAndLoginUser('ADMIN');
    const create = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validTransaction);

    const id = create.body.data.id;
    const del = await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(200);

    // Should not appear in list after soft delete
    const list = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data.find((t: { id: string }) => t.id === id)).toBeUndefined();
  });
});
