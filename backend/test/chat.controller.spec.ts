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
import { Chat } from '../src/models/chat.model';
import { Channel } from '../src/models/channel.model';
import { Message } from '../src/models/message.model';
import { Member } from '../types/member.alias';
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
    await Chat.deleteMany({});
    await Channel.deleteMany({});
    await Message.deleteMany({});
    await disconnectDatabase();
  });

  it('should create a new public chat /api/chat/create-chat', async () => {
    const res = await request(app)
      .post('/api/chat/create-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat' });

    expect(res.status).to.equal(201);
    expect(res.body.name).to.equal('newchat');
  });

  it('should fail to create a new public chat without a name /api/chat/create-chat', async () => {
    const res = await request(app)
      .post('/api/chat/create-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Chat name is required.');
  });

  it('should return status 500 during the creation of a new chat /api/chat/create-chat', async () => {
    const stub = sinon.stub(Chat, 'create').throws(new Error('DB down'));

    const res = await request(app)
      .post('/api/chat/create-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat' });

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during chat creation.');

    stub.restore();
  });

  it('should update the public chat room /api/chat/update-chat/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .patch(`/api/chat/update-chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat', topic: 'newtopic' });

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal('newchat');
    expect(res.body.topic).to.equal('newtopic');
  });

  it('should return status 404 if there is no chat /api/chat/update-chat/:chatId', async () => {
    const stub = sinon.stub(Chat, 'findById').callsFake(() => null);

    const res = await request(app)
      .patch(`/api/chat/update-chat/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'whatever' });

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal('Chat not found.');

    stub.restore();
  });

  it('should return status 500 during the update of a chat /api/chat/update-chat/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));

    const res = await request(app)
      .patch(`/api/chat/update-chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat', topic: 'newtopic' });

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during chat update.');

    stub.restore();
  });

  it('should return 403 if user lacks required permissions /api/chat/update-chat/:chatId', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'newuser2',
      email: 'newuser2@email.com',
      password: '123',
    });

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser2',
      password: '123',
    });

    const token = resLogin.body.token;

    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .patch(`/api/chat/update-chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat', topic: 'newtopic' });

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal(
      'You are not allowed to update this chat room.'
    );
  });

  it('should update the thumbnail /api/chat/update-chat/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .patch(`/api/chat/update-chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('thumbnail', Buffer.from('fake image'), {
        filename: 'thumbnail.png',
        contentType: 'image/png',
      });

    expect(res.status).to.equal(200);
    expect(res.body.thumbnail).to.match(/.png/g);
  });

  it('should delete the old thumbnail if oldThumbnail is provided /api/chat/update-chat/:chatId', async () => {
    const existsStub = sinon.stub(fs, 'existsSync').returns(true);
    const unlinkStub = sinon.stub(fs, 'unlinkSync');

    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .patch(`/api/chat/update-chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('oldThumbnail', chat.thumbnail)
      .attach('thumbnail', Buffer.from('fake image'), {
        filename: 'thumbnail.png',
        contentType: 'image/png',
      });

    expect(existsStub.called).to.be.true;
    expect(unlinkStub.called).to.be.true;
    expect(res.status).to.equal(200);
    expect(res.body.thumbnail).to.match(/.png/g);

    existsStub.restore();
    unlinkStub.restore();
  });

  it('should return status 404 if there is no chat while deleting the thumbnail /api/chat/delete-thumbnail/:chatId', async () => {
    const stub = sinon.stub(Chat, 'findById').callsFake(() => null);

    const res = await request(app)
      .delete(`/api/chat/delete-thumbnail/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal('Chat not found.');

    stub.restore();
  });

  it('should return status 500 during the deletion of the thumbnail /api/chat/delete-thumbnail/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));

    const res = await request(app)
      .delete(`/api/chat/delete-thumbnail/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal(
      'Server error during thumbnail deletion.'
    );

    stub.restore();
  });

  it('should return 403 if user lacks required permissions /api/chat/delete-thumbnail/:chatId', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'newuser2',
      email: 'newuser2@email.com',
      password: '123',
    });

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser2',
      password: '123',
    });

    const token = resLogin.body.token;

    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .delete(`/api/chat/delete-thumbnail/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal(
      'You are not allowed to update this chat room.'
    );
  });

  it('should delete the thumbnail /api/chat/delete-thumbnail/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .delete(`/api/chat/delete-thumbnail/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Thumbnail removed successfully.');
    expect(res.body.thumbnail).to.equal(undefined);
  });

  it('should fetch the chat room /api/chat/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .get(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.name).to.equal('newchat');
  });

  it('should only return channels the member (newuser) has access to /api/chat/:chatId', async () => {
    const chat = await Chat.findOne({ name: 'newchat' });
    const user = await User.findOne({ username: 'newuser' });

    const member = chat.members.find((m: Member) => m.user.equals(user._id));
    const userRoles = member.roles;

    await Channel.create({
      name: 'ownerChannel',
      chatId: chat._id,
      permissions: { adminsOnly: true },
    });

    await Channel.create({
      name: 'adminsOnlyChannel',
      chatId: chat._id,
      permissions: { adminsOnly: true },
    });

    await Channel.create({
      name: 'allowedUserChannel',
      chatId: chat._id,
      permissions: { allowedUsers: [user._id] },
    });

    await Channel.create({
      name: 'allowedRoleChannel',
      chatId: chat._id,
      permissions: { allowedRoles: [userRoles[0]] },
    });

    await Channel.create({
      name: 'blockedUserChannel',
      chatId: chat._id,
      permissions: { allowedUsers: [new mongoose.Types.ObjectId()] },
    });

    const res = await request(app)
      .get(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);

    const returnedChannelNames = res.body.channels.map(
      (c: typeof Channel) => c.name
    );

    // Expect the allowed ones.
    expect(returnedChannelNames).to.include('ownerChannel');
    expect(returnedChannelNames).to.include('allowedUserChannel');
    expect(returnedChannelNames).to.include('allowedRoleChannel');
  });

  it('should return only channels the member (newuser2) has access to /api/chat/:chatId', async () => {
    const chat = await Chat.findOne({ name: 'newchat' });
    const memberUser = await User.findOne({ username: 'newuser2' });

    chat.members.push({ user: memberUser._id, roles: ['Member'] });
    await chat.save();

    await Channel.create({
      name: 'adminsOnlyChannel',
      chatId: chat._id,
      permissions: { adminsOnly: true },
    });

    await Channel.create({
      name: 'allowedUserChannel',
      chatId: chat._id,
      permissions: { allowedUsers: [memberUser._id] },
    });

    await Channel.create({
      name: 'allowedRoleChannel',
      chatId: chat._id,
      permissions: { allowedRoles: ['Member'] },
    });

    await Channel.create({
      name: 'blockedUserChannel',
      chatId: chat._id,
      permissions: { allowedUsers: [new mongoose.Types.ObjectId()] },
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'newuser2',
      password: '123',
    });
    const memberToken = loginRes.body.token;

    const res = await request(app)
      .get(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).to.equal(200);

    const returnedNames = res.body.channels.map((c: typeof Channel) => c.name);

    // Member should see these:
    expect(returnedNames).to.include('allowedUserChannel');
    expect(returnedNames).to.include('allowedRoleChannel');

    // Member should NOT see these:
    expect(returnedNames).to.not.include('adminsOnlyChannel');
    expect(returnedNames).to.not.include('blockedUserChannel');

    chat.members = chat.members.filter(
      (m: Member) => !m.user.equals(memberUser._id)
    );
    await chat.save();
  });

  it('should fail to fetch the chat room without a chat ID /api/chat/:chatId', async () => {
    const res = await request(app)
      .get(`/api/chat/null`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Chat ID is required.');
  });

  it('should return status 404 if there is no chat /api/chat/:chatId', async () => {
    const res = await request(app)
      .get(`/api/chat/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal('Chat not found.');
  });

  it('should return status 500 during the fetching of a chat /api/chat/:chatId', async () => {
    const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));

    const res = await request(app)
      .get(`/api/chat/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during chat fetch.');

    stub.restore();
  });

  it('should return status 403 if the user is not a member of the chat /api/chat/:chatId', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser2',
      password: '123',
    });

    const token = resLogin.body.token;

    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .get(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal(
      'You are not a member of this chat room.'
    );
  });

  it('should fetch chat members /api/chat/:chatId/members', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .get(`/api/chat/${chat._id}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(1);
  });

  it('should return status 500 during the fetching of chat members /api/chat/:chatId/members', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const stub = sinon.stub(User, 'find').throws(new Error('DB down'));

    const res = await request(app)
      .get(`/api/chat/${chat._id}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal(
      'Server error during chat members fetch.'
    );

    stub.restore();
  });

  it('should return status 404 during the fetching of chat members with a fake chat ID /api/chat/:chatId/members', async () => {
    const res = await request(app)
      .get(`/api/chat/${new mongoose.Types.ObjectId()}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal('Chat not found.');
  });

  it('should return status 403 if the user is not a member of the chat /api/chat/:chatId/members', async () => {
    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser2',
      password: '123',
    });

    const token = resLogin.body.token;

    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .get(`/api/chat/${chat._id}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal(
      'You are not a member of this chat room.'
    );
  });

  it('should fetch chat rooms /api/chat/get-chat-rooms/', async () => {
    const res = await request(app)
      .get('/api/chat/get-chat-rooms')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.allRooms.length).to.equal(1);
  });

  it('should return status 500 during the fetching of chat rooms /api/chat/get-chat-rooms/', async () => {
    const stub = sinon
      .stub(Chat, 'countDocuments')
      .throws(new Error('DB down'));

    const res = await request(app)
      .get('/api/chat/get-chat-rooms')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during chat rooms fetch.');

    stub.restore();
  });

  it('should create a private chat room /private/:targetUserId', async () => {
    const newUser2 = await User.findOne({ username: 'newuser2' });
    const newUser = await User.findOne({ username: 'newuser' });

    const res = await request(app)
      .post(`/api/chat/private/${newUser2._id}`)
      .set('Authorization', `Bearer ${token}`);

    const privateChat = await Chat.findOne({
      isPrivate: true,
      members: {
        $all: [
          { $elemMatch: { user: newUser2._id } },
          { $elemMatch: { user: newUser._id } },
        ],
      },
    });

    expect(res.status).to.equal(200);
    expect(res.body._id).to.equal(privateChat._id.toString());
  });

  it('should return status 400 if both IDs are the same /private/:targetUserId', async () => {
    const newUser = await User.findOne({ username: 'newuser' });

    const res = await request(app)
      .post(`/api/chat/private/${newUser._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("You can't DM yourself.");
  });

  it('should return status 500 during the creation or fetch of a private chat room /private/:targetUserId', async () => {
    const stub = sinon.stub(Chat, 'findOne').throws(new Error('DB down'));

    const newUser2 = await User.findOne({ username: 'newuser2' });

    const res = await request(app)
      .post(`/api/chat/private/${newUser2._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal(
      'Server error during chat creation or fetch.'
    );

    stub.restore();
  });

  it('should fetch private chat rooms /api/chat/private/get-private-chat-rooms', async () => {
    const res = await request(app)
      .get('/api/chat/private/get-private-chat-rooms')
      .set('Authorization', `Bearer ${token}`);

    console.log(res.body);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(1);
  });

  // Delete Chat Room

  it('should return status 404 if there is no chat during the deletion /api/chat/:chatId', async () => {
    const stub = sinon.stub(Chat, 'findById').callsFake(() => null);

    const res = await request(app)
      .delete(`/api/chat/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal('Chat not found.');

    stub.restore();
  });

  it('should return status 403 if the user is not the owner /api/chat/:chatId', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'newuser2',
      email: 'newuser2@email.com',
      password: '123',
    });

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'newuser2',
      password: '123',
    });

    const token = resLogin.body.token;

    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .delete(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal('Only the owner can delete this chat.');
  });

  it('should return status 500 during the deletion of a chat /api/chat/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));

    const res = await request(app)
      .delete(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during chat deletion.');

    stub.restore();
  });

  it('should delete the chat room /api/chat/:chatId', async () => {
    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    const res = await request(app)
      .delete(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Chat room deleted successfully.');
  });

  it('should delete channels and messages associated to the chat room /api/chat/:chatId', async () => {
    await request(app)
      .post('/api/chat/create-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat' });

    const user = await User.findOne({ username: 'newuser' });

    const chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    await Channel.create({
      name: 'newchannel',
      chatId: chat._id,
    });

    const channelId = new mongoose.Types.ObjectId();

    await Message.create({
      chatId: chat._id,
      channelId: channelId,
      text: 'newmessage',
      sender: user._id,
    });

    const res = await request(app)
      .delete(`/api/chat/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    const channel = await Channel.findOne({
      name: 'newchannel',
      chatId: chat._id,
    });

    const message = await Message.findOne({
      chatId: chat._id,
      channelId: channelId,
      text: 'newmessage',
      sender: user._id,
    });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Chat room deleted successfully.');
    expect(channel).to.be.null;
    expect(message).to.be.null;
  });
});
