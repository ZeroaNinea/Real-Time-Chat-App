import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';

import { app } from '../src/app';
import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/user.model';
import { Message } from '../src/models/message.model';
import { Chat } from '../src/models/chat.model';
import { Channel } from '../src/models/channel.model';
import { verifyToken } from '../src/auth/jwt.service';

describe('Auth Controller', () => {
  let token: string;
  let chat: typeof Chat;
  let channel: typeof Channel;
  let newUser: typeof User;

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

    newUser = await User.findOne({ username: 'newuser' });

    for (let i = 0; i < 10; i++) {
      await Message.create({
        chatId: chat._id,
        channelId: channel._id,
        text: `newmessage${i}`,
        sender: newUser._id,
      });
    }
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
    expect(res.body.length).to.equal(10);

    for (let i = 0; i < 10; i++) {
      expect(res.body[i].text).to.equal(`newmessage${i}`);
    }
  });
});
