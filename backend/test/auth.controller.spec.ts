import { expect } from 'chai';
import request from 'supertest';

import { app } from '../src/app';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/user.model';

describe('Auth Controller', () => {
  before(async () => {
    await connectToDatabase();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await disconnectDatabase();
  });

  it('should create a new account /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });

    expect(res.status).to.equal(201);
    expect(res.body.message).to.equal('User registered successfully!');
  });

  it('should fail to create a new account with an existing username /api/auth/register', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Username already exists.');
  });

  it('should fail to create a new account without required fields /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Server error during registration.');
  });
});
