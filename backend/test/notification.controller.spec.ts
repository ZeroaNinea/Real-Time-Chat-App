import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import fs from 'fs';

import { app } from '../src/app';
import mongoose, {
  connectToDatabase,
  disconnectDatabase,
} from '../src/config/db';
import { User } from '../src/models/user.model';
import { verifyToken } from '../src/auth/jwt.service';

describe('Auth Controller', () => {
  let token: string;

  before(async () => {
    await connectToDatabase();

    const resRegister = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });

    expect(resRegister.status).to.equal(201);
    expect(resRegister.body.message).to.equal('User registered successfully!');

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    token = resLogin.body.token;

    const verifiedToken = verifyToken(resLogin.body.token);

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(verifiedToken.username).to.equal('newuser');
  });

  after(async () => {
    await User.deleteMany({});
    await disconnectDatabase();
  });

  it('should fetch notifications /api/notification/get-notifications', async () => {
    const res = await request(app)
      .get('/api/notification/get-notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(0);
  });
});
