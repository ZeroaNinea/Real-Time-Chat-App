import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';

import { app } from '../src/app';
import mongoose, {
  connectToDatabase,
  disconnectDatabase,
} from '../src/config/db';
import { User } from '../src/models/user.model';
import { Message } from '../src/models/message.model';
import { Chat } from '../src/models/chat.model';
import { Channel } from '../src/models/channel.model';
import { verifyToken } from '../src/auth/jwt.service';

describe('Auth Controller', () => {
  let token: string;
  let token2: string;
  let token3: string;
  let chat: typeof Chat;
  let privateChat: typeof Chat;
  let channel: typeof Channel;
  let newUser: typeof User;
  let newUser2: typeof User;
  let newUser3: typeof User;
  let replyMessages = [];
  let privateReplyMessages = [];

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

    const resChatRoom = await request(app)
      .post('/api/chat/create-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat' });

    expect(resChatRoom.status).to.equal(201);
    expect(resChatRoom.body.name).to.equal('newchat');

    chat = await Chat.findOne({
      name: 'newchat',
      isPrivate: false,
    });

    channel = await Channel.create({
      name: 'newchannel',
      chatId: chat._id,
    });

    newUser2 = await User.create({
      username: 'newuser2',
      email: 'newuser2@email.com',
      password: '123',
    });

    newUser3 = await User.create({
      username: 'newuser3',
      email: 'newuser3@email.com',
      password: '123',
    });

    const resLogin2 = await request(app).post('/api/auth/login').send({
      username: 'newuser2',
      password: '123',
    });

    token2 = resLogin2.body.token;

    newUser = await User.findOne({ username: 'newuser' });

    const resLogin3 = await request(app).post('/api/auth/login').send({
      username: 'newuser3',
      password: '123',
    });

    token3 = resLogin3.body.token;

    for (let i = 0; i < 40; i++) {
      let message = await Message.create({
        chatId: chat._id,
        channelId: channel._id,
        text: `newmessage${i}`,
        sender: newUser._id,
      });

      if (i % 5 === 0) {
        message = await Message.create({
          chatId: chat._id,
          channelId: channel._id,
          replyTo: message._id,
          text: `newmessage${i}`,
          sender: newUser2._id,
        });
      }
    }

    const resPrivateChat = await request(app)
      .post(`/api/chat/private/${newUser2._id}`)
      .set('Authorization', `Bearer ${token}`);

    privateChat = await Chat.findOne({
      isPrivate: true,
      members: {
        $all: [
          { $elemMatch: { user: newUser2._id } },
          { $elemMatch: { user: newUser._id } },
        ],
      },
    });

    expect(resPrivateChat.status).to.equal(200);
    expect(resPrivateChat.body._id).to.equal(privateChat._id.toString());

    for (let i = 0; i < 40; i++) {
      let message = await Message.create({
        chatId: privateChat._id,
        text: `newmessage${i}`,
        sender: newUser._id,
      });

      if (i % 5 === 0) {
        message = await Message.create({
          chatId: privateChat._id,
          replyTo: message._id,
          text: `newmessage${i}`,
          sender: newUser2._id,
        });
      }
    }

    replyMessages = await Message.find({
      chatId: privateChat._id,
      channelId: channel._id,
      replyTo: { $exists: true, $ne: null },
    });

    privateReplyMessages = await Message.find({
      chatId: privateChat._id,
      replyTo: { $exists: true, $ne: null },
    });
  });

  after(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
    await Chat.deleteMany({});
    await Channel.deleteMany({});
    await disconnectDatabase();
  });

  it('should fetch messages /api/message/get-messages/chatId/:chatId/channelId/:channelId', async () => {
    const res = await request(app)
      .get(
        `/api/message/get-messages/chat-room/${chat._id}/channel/${channel._id}`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(20);

    for (let i = 20; i < 0; i--) {
      expect(res.body[i].text).to.equal(`newmessage${i}`);
    }
  });

  it('should return status 500 if chat ID or channel ID is invalid /api/message/get-messages/chatId/:chatId/channelId/:channelId', async () => {
    const res = await request(app)
      .get(`/api/message/get-messages/chat-room/${chat._id}/channel/:channelId`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during getting messages.');
  });

  it('should return status 403 if user is not a member of the chat /api/message/get-messages/chatId/:chatId/channelId/:channelId', async () => {
    const res = await request(app)
      .get(
        `/api/message/get-messages/chat-room/${chat._id}/channel/${channel._id}`
      )
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal(
      'You are not a member of this chat room.'
    );
  });

  it('should return status 400 if the chat room is private /api/message/get-messages/chatId/:chatId/channelId/:channelId', async () => {
    const res = await request(app)
      .get(
        `/api/message/get-messages/chat-room/${privateChat._id}/channel/${channel._id}`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      'This route cannot be used for private chats.'
    );
  });

  it('should return the next page of messages /api/message/get-messages/chatId/:chatId/channelId/:channelId', async () => {
    const res = await request(app)
      .get(
        `/api/message/get-messages/chat-room/${chat._id}/channel/${channel._id}`
      )
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(20);

    for (let i = 20; i < 0; i--) {
      expect(res.body[i].text).to.equal(`newmessage${i}`);
    }

    const res2 = await request(app)
      .get(
        `/api/message/get-messages/chat-room/${chat._id}/channel/${channel._id}`
      )
      .set('Authorization', `Bearer ${token}`)
      .query({ before: res.body[res.body.length - 1]._id });

    expect(res2.status).to.equal(200);
    expect(res2.body.length).to.equal(20);

    for (let i = 40; i < 0; i--) {
      expect(res2.body[i - 20].text).to.equal(`newmessage${i}`);
    }
  });

  it('should return status 400 if before is invalid /api/message/get-messages/chatId/:chatId/channelId/:channelId', async () => {
    const res = await request(app)
      .get(
        `/api/message/get-messages/chat-room/${chat._id}/channel/${channel._id}`
      )
      .set('Authorization', `Bearer ${token}`)
      .query({ before: 'invalid' });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Invalid before ID.');
  });

  it('should return private messages /api/message/get-private-messages/:chatId', async () => {
    const res = await request(app)
      .get(`/api/message/get-private-messages/${privateChat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(20);

    for (let i = 20; i < 0; i--) {
      expect(res.body[i].text).to.equal(`newmessage${i}`);
    }
  });

  it('should fail to provide access to the private chat room for newUser3 /api/message/get-private-messages/:chatId', async () => {
    const res = await request(app)
      .get(`/api/message/get-private-messages/${privateChat._id}`)
      .set('Authorization', `Bearer ${token3}`);

    expect(res.status).to.equal(403);
    expect(res.body.message).to.equal(
      'You are not a member of this chat room.'
    );
  });

  it('should return status 500 if chat ID is invalid /api/message/get-private-messages/:chatId', async () => {
    const res = await request(app)
      .get(`/api/message/get-private-messages/:chatId`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal('Server error during getting messages.');
  });

  it('should fail to access to a public chat room using this route /api/message/get-private-messages/:chatId', async () => {
    const res = await request(app)
      .get(`/api/message/get-private-messages/${chat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      'This route cannot be used for public chats.'
    );
  });

  it('should return the next page of private messages /api/message/get-private-messages/:chatId', async () => {
    const res = await request(app)
      .get(`/api/message/get-private-messages/${privateChat._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.length).to.equal(20);

    for (let i = 20; i < 0; i--) {
      expect(res.body[i].text).to.equal(`newmessage${i}`);
    }

    const res2 = await request(app)
      .get(`/api/message/get-private-messages/${privateChat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .query({ before: res.body[res.body.length - 1]._id });

    expect(res2.status).to.equal(200);
    expect(res2.body.length).to.equal(20);

    for (let i = 40; i < 0; i--) {
      expect(res2.body[i - 20].text).to.equal(`newmessage${i}`);
    }
  });

  it('should return status 400 if before is invalid /api/message/get-private-messages/:chatId', async () => {
    const res = await request(app)
      .get(`/api/message/get-private-messages/${privateChat._id}`)
      .set('Authorization', `Bearer ${token}`)
      .query({ before: 'invalid' });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Invalid before ID.');
  });
});
