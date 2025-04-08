import request from 'supertest';
import { expect } from 'chai';
import { app } from '../src/app';
import { server } from '../src/server';
import { disconnectDatabase } from '../src/config/db';

describe('Test App Router', () => {
  it('should test registration, login, account and delete routes', async () => {
    // Register a user.
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

    // Checik if the user already exists.
    const res2 = await request(app)
      .post('/auth/register')
      .send({
        username: 'imgay',
        email: 'imgay@gmail.com',
        password: 'imgay',
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res2.status).to.equal(400);
    expect(res2.text).to.equal('Username already exists.');

    // Provoke an error.
    const res3 = await request(app)
      .post('/auth/register')
      .send({
        username: "Bohahahahah! I'm an evil hacker!",
        email: () => {
          console.log('Evil hacker function! >:(');
        },
        password: 'hacker_password',
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res3.status).to.equal(500);
    expect(res3.body.error).to.equal('Server error during registration.');

    // Login the user.
    const res4 = await request(app)
      .post('/auth/login')
      .send({
        username: 'imgay',
        password: 'imgay',
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res4.status).to.equal(200);
    expect(res4.body.message).to.equal('Login successful!');

    // Provoke an invalid login or password error.
    const res5 = await request(app)
      .post('/auth/login')
      .send({
        username: 'imgay',
        password: 'wrong_password',
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(res5.status).to.equal(401);
    expect(res5.body.message).to.equal('Invalid username or password.');
  });

  it('should return 401 for /auth/account', async () => {
    const res = await request(app).get('/auth/account');
    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Access denied. No headers provided.');
  });

  after(async () => {
    await disconnectDatabase();
    server.close(async () => {
      console.log('Server and database connections closed.');
    });
  });
});
