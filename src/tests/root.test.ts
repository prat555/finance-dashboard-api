import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app';

describe('GET /', () => {
  it('returns API status and entry points', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Finance Dashboard API is running');
    expect(res.body.docs).toBe('/api/docs');
    expect(res.body.health).toBe('/health');
  });
});