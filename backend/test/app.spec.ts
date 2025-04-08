import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/app';
import { server } from '../src/server';

describe('Test App Router', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'imgay',
        email: 'imgay@gmail.com',
        password: 'imgay',
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    expect(res.status).to.equal(201);
    expect(res.body.message).to.equal('User registered successfully!');

    console.log(res.body.message, res.status, '============================');
  });

  it('should return 401 for /auth/account', async () => {
    const res = await request(app).get('/auth/account');
    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Access denied. No headers provided.');
  });

  after((done) => {
    server.close(done);
  });
});
