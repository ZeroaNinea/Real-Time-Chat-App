import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/app';

describe('Test App Router', () => {
  it('should return 200 for /auth/register', async () => {
    const res = await request(app).get('/auth/register');
    expect(res.status).to.equal(200);
  });
});
