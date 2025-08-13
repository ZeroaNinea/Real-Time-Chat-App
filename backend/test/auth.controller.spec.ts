import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import fs from 'fs';

import { app } from '../src/app';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/user.model';
import { verifyToken } from '../src/auth/jwt.service';
import { redisClient } from '../src/config/redis';
import pictureHelper from '../src/helpers/picture-helper';

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

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${resLogin.body.token}`);

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Server error during logout.');

    stub.restore();
  });

  it('should visit the account route /api/auth/account', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const res = await request(app)
      .get('/api/auth/account')
      .set('Authorization', `Bearer ${resLogin.body.token}`);

    const token = verifyToken(resLogin.body.token);

    expect(res.status).to.equal(200);
    expect(res.body.username).to.equal('newuser');
  });

  it('should update the email /api/auth/update-email', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-email')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ email: 'newemail' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(200);
    expect(res.body.email).to.equal('newemail');
  });

  it('should fail to update the email without an email /api/auth/update-email', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-email')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({});

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Email is required');
  });

  it('should fail to use an existing email /api/auth/update-email', async () => {
    const resRegister = await request(app).post('/api/auth/register').send({
      username: 'newuser2',
      email: 'newuser2@email.com',
      password: '123',
    });

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-email')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ email: 'newuser2@email.com' });

    expect(resRegister.status).to.equal(201);
    expect(resRegister.body.message).to.equal('User registered successfully!');
    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal('Email already in use');
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

  it('should fail to update the username and bio without a bio /api/auth/update-username-bio', async () => {
    const resRegister = await request(app).post('/api/auth/register').send({
      username: 'newuser',
      email: 'newuser@email.com',
      password: '123',
    });

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-username-bio')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ username: 'newusername' });

    expect(resRegister.status).to.equal(201);
    expect(resRegister.body.message).to.equal('User registered successfully!');
    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Bio is required');
  });

  it('should fail to update the username and bio without a username /api/auth/update-username-bio', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-username-bio')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ bio: 'newbio' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Username is required');
  });

  it('should fail to update the username and bio with an existing username /api/auth/update-username-bio', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-username-bio')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ username: 'newuser2', bio: 'newbio' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal('Username already in use');
  });

  it('should update the username and bio /api/auth/update-username-bio', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-username-bio')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ username: 'newusername', bio: 'newbio' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newuser');
    expect(res.status).to.equal(200);
    expect(res.body.username).to.equal('newusername');
    expect(res.body.bio).to.equal('newbio');
  });

  it('should update the password /api/auth/update-password', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newusername',
      password: '123',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-password')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ newPassword: 'newpassword', currentPassword: '123' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newusername');
    expect(res.status).to.equal(200);
    expect(res.body.username).to.equal('newusername');
  });

  it('should fail to update the password without the password without the current password /api/auth/update-password', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newusername',
      password: 'newpassword',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-password')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ newPassword: '123' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newusername');
    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      'Both current and new password are required'
    );
  });

  it('should fail to update the password when the current password is incorrect /api/auth/update-password', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newusername',
      password: 'newpassword',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-password')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ newPassword: '123', currentPassword: 'wrongpassword' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newusername');
    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Current password is incorrect');
  });

  it('should update pronouns /api/auth/update-pronouns', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newusername',
      password: 'newpassword',
    });

    const token = verifyToken(resLogin.body.token);

    const res = await request(app)
      .put('/api/auth/update-pronouns')
      .set('Authorization', `Bearer ${resLogin.body.token}`)
      .send({ pronouns: 'they/them' });

    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.message).to.equal('Login successful!');
    expect(token.username).to.equal('newusername');
    expect(res.status).to.equal(200);
    expect(res.body.pronouns).to.equal('they/them');
  });

  it('should update the avatar /api/auth/update-avatar', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'newusername',
      password: 'newpassword',
    });

    const res = await request(app)
      .post('/api/auth/update-avatar')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .attach('avatar', Buffer.from('fake image'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).to.equal(200);
    expect(res.body.avatar).to.match(/^uploads\/avatars\//);
  });

  it('should fail to update the avatar without an avatar /api/auth/update-avatar', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'newusername',
      password: 'newpassword',
    });

    const res = await request(app)
      .post('/api/auth/update-avatar')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Avatar is required.');
  });

  it('should delete old avatar if oldAvatar is provided /api/auth/update-avatar', async () => {
    const existsStub = sinon.stub(fs, 'existsSync').returns(true);
    const unlinkStub = sinon.stub(fs, 'unlinkSync');

    await User.create({
      username: 'user3',
      password: 'pass123',
      email: 'user3@email.com',
      avatar: 'uploads/avatars/old.png',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'user3',
      password: 'pass123',
    });

    const res = await request(app)
      .post('/api/auth/update-avatar')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .field('oldAvatar', 'uploads/avatars/old.png')
      .attach('avatar', Buffer.from('fake image'), {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(existsStub.called).to.be.true;
    expect(unlinkStub.called).to.be.true;
    expect(res.status).to.equal(200);

    existsStub.restore();
    unlinkStub.restore();
  });

  it('should remove the avatar /api/auth/remove-avatar', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'newusername',
      password: 'newpassword',
    });

    const res = await request(app)
      .delete('/api/auth/remove-avatar')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Avatar removed.');
  });

  it('should return 500 if deleteAvatarFile throws', async () => {
    await User.create({
      username: 'userX',
      password: 'pass123',
      email: 'userX@email.com',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'userX',
      password: 'pass123',
    });

    const stub = sinon.stub(pictureHelper, 'deleteAvatarFile').callsFake(() => {
      throw new Error('FS fail');
    });

    const res = await request(app)
      .delete('/api/auth/remove-avatar')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Server error during avatar removal.');

    stub.restore();
  });
});
