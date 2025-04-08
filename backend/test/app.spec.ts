import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/app';

describe('Test App Router', () => {
  it('should return 401 for /auth/account', async () => {
    const res = await request(app).get('/auth/account');
    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Access denied. No headers provided.');
  });
});
