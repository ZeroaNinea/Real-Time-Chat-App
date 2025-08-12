import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';

import { app } from '../src/app';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/user.model';
import { verifyToken } from '../src/auth/jwt.service';

import socialHelpers from '../src/helpers/social-helpers';

describe('Social Controller', () => {
  let token: string;
  let userId: string;
  let friendUserId: string;
  let bannedUserId: string;
  let cleanFriendId: string;

  before(async () => {
    await connectToDatabase();

    const resRegister = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });
    expect(resRegister.status).to.equal(201);

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });
    expect(resLogin.status).to.equal(200);

    token = resLogin.body.token;
    const verifiedToken = verifyToken(token);
    expect(verifiedToken.username).to.equal('newuser');

    const user = await User.findOne({ username: 'newuser' });
    userId = user._id.toString();

    const friendUser = await User.create({
      username: 'friend',
      email: 'friend@email.com',
      password: '123',
      friends: [userId],
      banlist: [userId],
    });
    friendUserId = friendUser._id.toString();

    const cleanFriend = await User.create({
      username: 'cleanf',
      email: 'cleanf@email.com',
      password: '123',
      friends: [userId],
    });
    cleanFriendId = cleanFriend._id.toString();

    const bannedUser = await User.create({
      username: 'banned',
      email: 'banned@email.com',
      password: '123',
    });
    bannedUserId = bannedUser._id.toString();

    user.friends.push(friendUserId, cleanFriendId);
    user.banlist.push(bannedUserId);
    await user.save();
  });

  after(async () => {
    await User.deleteMany({});
    await disconnectDatabase();
  });

  it('should return only friends who are not banned by either side /api/social/get-friends', async () => {
    const res = await request(app)
      .get('/api/social/get-friends')
      .set('Authorization', `Bearer ${token}`);

    console.log(res.body, '=============================');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');

    const friendUsernames = res.body.map((f: typeof User) => f.username);

    expect(friendUsernames).to.include('cleanf');
    expect(friendUsernames).to.not.include('friend');
    expect(friendUsernames).to.not.include('banned');
  });

  it('should return status 500 during the fetching of friends /api/social/get-friends', async () => {
    const stub = sinon
      .stub(socialHelpers, 'getUserWithFriends')
      .throws(new Error('DB down'));

    const res = await request(app)
      .get('/api/social/get-friends')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during friends fetch.');

    stub.restore();
  });

  it('should return the correct banlist /api/social/get-ban-list', async () => {
    const res = await request(app)
      .get('/api/social/get-ban-list')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');

    const banUsernames = res.body.map((u: typeof User) => u.username);
    expect(banUsernames).to.include('banned');
    expect(banUsernames).to.not.include('friend');
  });

  it('should return status 500 during the fetching of banlist /api/social/get-ban-list', async () => {
    const stub = sinon
      .stub(socialHelpers, 'getUserWithBanlist')
      .throws(new Error('DB down'));

    const res = await request(app)
      .get('/api/social/get-ban-list')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during banlist fetch.');

    stub.restore();
  });
});
