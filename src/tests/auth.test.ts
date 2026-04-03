import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';

// ── Helpers ───────────────────────────────────────────────────────────────────
const registerAdmin = () =>
  request(app).post('/api/auth/register').send({
    name: 'Test Admin',
    email: 'testadmin@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

const loginAs = (email: string, password: string) =>
  request(app).post('/api/auth/login').send({ email, password });

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
describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await registerAdmin();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('testadmin@example.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('returns 409 when email already in use', async () => {
    await registerAdmin();
    const res = await registerAdmin();
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short',
      email: 'short@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerAdmin();
  });

  it('logs in with correct credentials', async () => {
    const res = await loginAs('testadmin@example.com', 'password123');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  it('returns 401 for wrong password', async () => {
    const res = await loginAs('testadmin@example.com', 'wrongpassword');
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await loginAs('nobody@example.com', 'password123');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    await registerAdmin();
    const login = await loginAs('testadmin@example.com', 'password123');
    const token = login.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('testadmin@example.com');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
