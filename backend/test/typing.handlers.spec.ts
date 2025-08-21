import { expect } from 'chai';
import { createServer } from 'http';
import request from 'supertest';

import { app } from '../src/app';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Server } from 'socket.io';

import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { setupSocket } from '../src/socket';
import { User } from '../src/models/user.model';
import { Chat } from '../src/models/chat.model';
import { Channel } from '../src/models/channel.model';

describe('Auth Socket Handlers', () => {
  let server: ReturnType<typeof createServer>;
  let address: string;
  let clientSocket: ClientSocket;
  let io: Server;
  let user: typeof User;
  let user2: typeof User;
  let user3: typeof User;
  let user4: typeof User;
  let token: string;
  let chat: typeof Chat;
  let channel: typeof Channel;

  before(async () => {
    await connectToDatabase();

    user = await User.create({
      username: 'socketuser',
      email: 'socket@email.com',
      password: '123',
      status: 'offline',
    });

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'socketuser',
      password: '123',
    });

    token = resLogin.body.token;

    await request(app)
      .post('/api/chat/create-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat' });

    chat = await Chat.findOne({ name: 'newchat' });

    await request(app)
      .post(`/api/chat/private/${user2._id}`)
      .set('Authorization', `Bearer ${token}`);

    server = createServer(app);
    io = setupSocket(server, app);

    await new Promise<void>((resolve) => {
      server.listen(() => {
        const port = (server.address() as any).port;
        address = `http://localhost:${port}`;
        resolve();
      });
    });

    chat.roles.push({
      name: 'Channel-Creator',
      description: 'Can create channels',
      permissions: ['canCreateChannels'],
    });

    chat.members.push({
      user: user3._id,
      roles: ['Member', 'Channel-Creator'],
    });
    chat.members.push({ user: user4._id, roles: ['Member'] });
    await chat.save();

    await Channel.create({
      name: 'newChannel',
      order: 1,
      chatId: chat._id,
    });

    channel = await Channel.findOne({ name: 'newChannel' });
  });

  after(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Channel.deleteMany({});
    await disconnectDatabase();
    io.close();
    server.close();
  });

  it('should start typing', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', {
        chatId: `${user._id}:${channel._id}`,
      });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(`${user._id}:${channel._id}`);

        clientSocket.emit(
          'typingStart',
          {
            chatId: chat._id,
            channelId: channel._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('userTypingStart', (data) => {
          expect(data.chatId).to.equal(chat._id.toString());
          expect(data.channelId).to.equal(channel._id.toString());
          expect(data.userId).to.equal(user._id.toString());
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should stop typing', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', {
        chatId: `${user._id}:${channel._id}`,
      });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(`${user._id}:${channel._id}`);

        clientSocket.emit(
          'typingStop',
          {
            chatId: chat._id,
            channelId: channel._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('userTypingStop', (data) => {
          expect(data.chatId).to.equal(chat._id.toString());
          expect(data.channelId).to.equal(channel._id.toString());
          expect(data.userId).to.equal(user._id.toString());
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });
});
