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
// import { Chat } from '../src/models/chat.model';
// import { Channel } from '../src/models/channel.model';
// import { Message } from '../src/models/message.model';
// import { Member } from '../types/member.alias';
import { verifyToken } from '../src/auth/jwt.service';

import favorites from '../src/helpers/favorites';

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
    // await Chat.deleteMany({});
    // await Channel.deleteMany({});
    // await Message.deleteMany({});
    await disconnectDatabase();
  });

  it('should fetch favorites /api/favorites/get-favorites', async () => {
    const user = await User.findOne({ username: 'newuser' });

    user.favoriteGifs.push('https://media.tenor.com/7YvM5lH6z1QAAAAC/sad.gif');
    await user.save();

    const res = await request(app)
      .get('/api/favorites/get-favorites')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(
      res.body.includes('https://media.tenor.com/7YvM5lH6z1QAAAAC/sad.gif')
    ).to.equal(true);
  });

  it('should return status 500 during the fetching of favorites /api/favorites/get-favorites', async () => {
    const stub = sinon
      .stub(favorites, 'findFavorites')
      .throws(new Error('DB down'));

    const res = await request(app)
      .get('/api/favorites/get-favorites')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during favorites fetch.');

    stub.restore();
  });

  it('should add a favorite /api/favorites/add-favorite', async () => {
    const res = await request(app)
      .post('/api/favorites/add-favorite')
      .set('Authorization', `Bearer ${token}`)
      .send({ gifUrl: 'https://tenor.com/duZQQsb5UlS.gif' });

    expect(res.status).to.equal(200);
    expect(res.body.includes('https://tenor.com/duZQQsb5UlS.gif')).to.equal(
      true
    );
  });

  it('should return status 400 if gifUrl is missing /api/favorites/add-favorite', async () => {
    const res = await request(app)
      .post('/api/favorites/add-favorite')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('GIF URL required.');
  });

  it('should return status 500 during the adding of a favorite /api/favorites/add-favorite', async () => {
    const stub = sinon
      .stub(favorites, 'findFavorites')
      .throws(new Error('DB down'));

    const res = await request(app)
      .post('/api/favorites/add-favorite')
      .set('Authorization', `Bearer ${token}`)
      .send({ gifUrl: 'https://tenor.com/duZQQsb5UlS.gif' });

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during favorite adding.');

    stub.restore();
  });

  it('should return status 400 if gifUrl is missing /api/favorites/remove-favorite', async () => {
    const res = await request(app)
      .delete('/api/favorites/remove-favorite')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('GIF URL required.');
  });

  it('should remove favorite /api/favorites/remove-favorite', async () => {
    const res = await request(app)
      .delete('/api/favorites/remove-favorite')
      .set('Authorization', `Bearer ${token}`)
      .send({ gifUrl: 'https://tenor.com/duZQQsb5UlS.gif' });

    expect(res.status).to.equal(200);
    expect(res.body.includes('https://tenor.com/duZQQsb5UlS.gif')).to.equal(
      false
    );
  });
});
