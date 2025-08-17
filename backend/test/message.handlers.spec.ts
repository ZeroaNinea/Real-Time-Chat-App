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
import { Role } from '../types/role.alias';
import { Member } from '../types/member.alias';

describe('Auth Socket Handlers', () => {
  let server: ReturnType<typeof createServer>;
  let address: string;
  let clientSocket: ClientSocket;
  let io: Server;
  let user: typeof User;
  let user2: typeof User;
  let user3: typeof User;
  let user4: typeof User;
  let user5: typeof User;
  let userModerator: typeof User;
  let token: string;
  let token2: string;
  let token3: string;
  let token4: string;
  let token5: string;
  let tokenModerator: string;
  let chat: typeof Chat;
  let privateChat: typeof Chat;
  let fakePrivateChat: typeof Chat;
  let fakePrivateChat2: typeof Chat;
  let fakeUserId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId();

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

    user5 = await User.create({
      username: 'socketuser5',
      email: 'socket5@email.com',
      password: '123',
      status: 'offline',
    });

    userModerator = await User.create({
      username: 'moderator',
      email: 'moderator@email.com',
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

    const resLogin5 = await request(app).post('/api/auth/login').send({
      username: 'socketuser5',
      password: '123',
    });

    token5 = resLogin5.body.token;

    const resLoginModerator = await request(app).post('/api/auth/login').send({
      username: 'moderator',
      password: '123',
    });

    tokenModerator = resLoginModerator.body.token;

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

    fakePrivateChat = await Chat.create({
      name: 'Fake-Private-Chat',
      isPrivate: true,
      members: [
        {
          user: fakeUserId,
        },
        {
          user: user._id,
        },
      ],
    });

    fakePrivateChat2 = await Chat.create({
      name: 'Fake-Private-Chat-2',
      isPrivate: true,
      members: [],
    });

    chat.roles.push({
      name: 'Channel-Creator',
      description: 'Can create channels',
      permissions: ['canCreateChannels'],
    });
    chat.roles.push({
      name: 'Junior-Role-Manager',
      description: 'Can manage roles on a junior level.',
      permissions: ['canAssignRoles'],
    });
    chat.roles.push({
      name: 'Cute-Role',
      description: 'Cute-Role',
    });
    chat.roles.push({
      name: 'Toggle-Role',
      description: 'Toggle-Role',
      canBeSelfAssigned: true,
    });
    chat.roles.push({
      name: 'ID-Restricted-Role',
      description: 'ID-Restricted-Role',
      canBeSelfAssigned: true,
      allowedUserIds: [user4._id],
    });
    chat.roles.push({
      name: 'Role-Restricted-Role',
      description: 'Role-Restricted-Role',
      canBeSelfAssigned: true,
      allowedRoles: ['Cute-Role'],
    });
    chat.roles.push({
      name: 'Broken-Role',
      description: 'Broken-Role',
      permissions: ['canDeleteChatroom'],
      canBeSelfAssigned: true,
    });
    chat.roles.push({
      name: 'Removing-Role',
      description: 'Removing-Role',
      canBeSelfAssigned: true,
    });

    chat.members.push({
      user: user._id,
      roles: ['Member', 'Channel-Creator', 'Removing-Role'],
    });
    chat.members
      .find((member: Member) => member.user.toString() === user._id.toString())
      .roles.push('Removing-Role');
    chat.members.push({
      user: user2._id,
      roles: ['Member', 'Channel-Creator'],
    });
    chat.members.push({
      user: user3._id,
      roles: ['Member', 'Channel-Creator', 'Junior-Role-Manager'],
    });
    chat.members.push({ user: user4._id, roles: ['Member'] });
    chat.members.push({
      user: userModerator._id,
      roles: ['Member', 'Moderator'],
    });

    await chat.save();
  });

  after(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Channel.deleteMany({});
    await disconnectDatabase();
    io.close();
    server.close();
  });

  it('should send a message', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit('addChannel', {
          chatId: chat._id,
          channelName: 'newchannel',
        });

        clientSocket.on('channelAdded', (newChannel) => {
          expect(newChannel.name).to.equal('newchannel');

          clientSocket.emit(
            'message',
            {
              chatId: chat._id,
              channelId: newChannel._id,
              message: 'new message',
            },
            done
          );

          clientSocket.on('message', (response) => {
            expect(response.text).to.equal('new message');
            clientSocket.disconnect();
            done();
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user5 to send a message because they are not a member', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token5 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit('message', {
          chatId: chat._id,
          channelId: channel._id,
          message: 'new message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('You are not a member of this chat.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during sending a message', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));
        const channel = await Channel.findOne({ name: 'newchannel' });
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit('message', {
          chatId: chat._id,
          channelId: channel._id,
          message: 'new message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('Server error during sending a message.');
          clientSocket.disconnect();
          stub.restore();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to use the "message" route for the private chat room', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit('message', {
          chatId: privateChat._id,
          channelId: channel._id,
          message: 'new message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('This is a private chat.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to use the "message" route with a wrong chat ID', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit('message', {
          chatId: new mongoose.Types.ObjectId(),
          channelId: channel._id,
          message: 'new message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('Chat is not found.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to use the "message" route with a wrong channel ID', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit('message', {
          chatId: chat._id,
          channelId: new mongoose.Types.ObjectId(),
          message: 'new message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('Channel is not found.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should send a private message', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit('privateMessage', {
          chatId: privateChat._id,
          message: 'new private message',
        });

        clientSocket.on('message', (response) => {
          expect(response.text).to.equal('new private message');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow to send a private message with a wrong private chat ID', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit('privateMessage', {
          chatId: new mongoose.Types.ObjectId(),
          message: 'new private message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('Chat is not found.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow to use the handres for private messages for public chats', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit('privateMessage', {
          chatId: chat._id,
          message: 'new private message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('This chat is not private.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('sould return users are not found when uses the fake private chat room to send a private message', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: fakePrivateChat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(fakePrivateChat._id.toString());

        clientSocket.emit('privateMessage', {
          chatId: fakePrivateChat._id,
          message: 'new private message',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('Users are not found.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });
});
