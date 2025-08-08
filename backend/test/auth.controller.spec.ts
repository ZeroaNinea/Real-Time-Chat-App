import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';

import { app } from '../src/app';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/user.model';
import { verifyToken } from '../src/auth/jwt.service';
import { redisClient } from '../src/config/redis';

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

  it('should return server error during login /api/auth/login', async () => {
    const stub = sinon.stub(User, 'findOne').throws(new Error('DB down'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'whatever', password: 'whatever' });

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during login.');

    stub.restore();
  });

  it('should return username and passowrd are required /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Username and password are required.');
  });

  it('should fail to create a new account without required fields /api/auth/register', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Server error during registration.');
  });

  it('should fail to delete an account without a token /api/auth/delete-account', async () => {
    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer `)
      .send({ password: '123' });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Access denied. No token provided.');
  });

  it('should fail to delete an account without a password /api/auth/delete-account', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({});

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Password is required.');
  });

  it('should fail to delete an account if the password is incorrect /api/auth/delete-account', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ password: '1234' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Invalid password.');
  });

  it('should return 500 if DB error occurs /api/auth/delete-account', async () => {
    const stub = sinon.stub(User, 'deleteOne').throws(new Error('DB down'));

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ password: '123' });

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Server error during account deletion.');

    stub.restore();
  });

  it('should fail to log out because of a server error /api/auth/logout', async () => {
    const stub = sinon.stub(redisClient, 'del').throws(new Error('Redis down'));

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${resLogin.body.token}`);

    // expect(resLogin.status).to.equal(200);
    // expect(resLogin.body.message).to.equal('Login successful!');
    // expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Server error during logout.');

    stub.restore();
  });

  it('should log out /api/auth/logout', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${resLogin.body.token}`);

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Logged out successfully.');
  });

  it('should delete the account /api/auth/delete-account', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ password: '123' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Account deleted successfully!');
  });
});
