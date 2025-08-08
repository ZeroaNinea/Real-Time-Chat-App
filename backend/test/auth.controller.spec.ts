import { expect } from 'chai';
import request from 'supertest';
import { verifyToken } from '../src/auth/jwt.service';

import { app } from '../src/app';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/user.model';

describe('Auth Controller', () => {
  before(async () => {
    await connectToDatabase();
  });

  after(async () => {
    await User.deleteMany({});
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
    const res = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Username already exists.');
  });

  it('should login /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(res.body.token);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
  });

  it('should return invalid username or password /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '1234',
    });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Invalid username or password.');
  });

  it('should fail to create a new account without required fields /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Server error during registration.');
  });
});
