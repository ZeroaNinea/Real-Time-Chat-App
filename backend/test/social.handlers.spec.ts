import { expect } from 'chai';
import { createServer } from 'http';
import sinon from 'sinon';
import request from 'supertest';

import { app } from '../src/app';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Server } from 'socket.io';

import mongoose, {
  connectToDatabase,
  disconnectDatabase,
} from '../src/config/db';
import { setupSocket } from '../src/socket';
import { User } from '../src/models/user.model';
import { Chat } from '../src/models/chat.model';
import { Channel } from '../src/models/channel.model';
import { Notification } from '../src/models/notification.model';

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
  let token2: string;
  let token3: string;
  let token4: string;
  let chat: typeof Chat;
  let privateChat: typeof Chat;

  before(async () => {
    await connectToDatabase();

    user = await User.create({
      username: 'socketuser',
      email: 'socket@email.com',
      password: '123',
      status: 'offline',
    });

    user2 = await User.create({
      username: 'socketuser2',
      email: 'socket2@email.com',
      password: '123',
      status: 'offline',
    });

    user3 = await User.create({
      username: 'socketuser3',
      email: 'socket3@email.com',
      password: '123',
      status: 'offline',
    });

    user4 = await User.create({
      username: 'socketuser4',
      email: 'socket4@email.com',
      password: '123',
      status: 'offline',
    });

    const resLogin = await request(app).post('/api/auth/login').send({
      username: 'socketuser',
      password: '123',
    });

    token = resLogin.body.token;

    const resLogin2 = await request(app).post('/api/auth/login').send({
      username: 'socketuser2',
      password: '123',
    });

    token2 = resLogin2.body.token;

    const resLogin3 = await request(app).post('/api/auth/login').send({
      username: 'socketuser3',
      password: '123',
    });

    token3 = resLogin3.body.token;

    const resLogin4 = await request(app).post('/api/auth/login').send({
      username: 'socketuser4',
      password: '123',
    });

    token4 = resLogin4.body.token;

    await request(app)
      .post('/api/chat/create-chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'newchat' });

    chat = await Chat.findOne({ name: 'newchat' });

    await request(app)
      .post(`/api/chat/private/${user2._id}`)
      .set('Authorization', `Bearer ${token}`);

    privateChat = await Chat.findOne({
      isPrivate: true,
      members: {
        $all: [
          { $elemMatch: { user: user2._id } },
          { $elemMatch: { user: user._id } },
        ],
      },
    });

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
  });

  after(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Channel.deleteMany({});
    await Notification.deleteMany({});
    await disconnectDatabase();
    io.close();
    server.close();
  });
});
