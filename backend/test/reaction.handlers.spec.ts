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
import { Member } from '../types/member.alias';
import { Message } from '../src/models/message.model';
import { Role } from '../types/role.alias';

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
  let fakeMessage: typeof Message;
  let fakeMessage2: typeof Message;
  let fakeMessage3: typeof Message;
  let reactedMessage: typeof Message;

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

    fakeMessage = await Message.create({
      text: 'Fake-Message',
      sender: fakeUserId,
      chatId: new mongoose.Types.ObjectId(),
    });

    fakeMessage2 = await Message.create({
      text: 'Fake-Message-2',
      sender: fakeUserId,
      chatId: fakePrivateChat2._id,
    });

    fakeMessage3 = await Message.create({
      text: 'Fake-Message-3',
      sender: fakeUserId,
      chatId: fakePrivateChat._id,
    });

    const emojis = [
      '🚶‍♀️‍➡️',
      '👎',
      '🤷',
      '😂',
      '😡',
      '👀',
      '👏',
      '🙌',
      '👋',
      '👌',
      '👈',
      '👉',
      '👆',
      '👇',
      '👊',
      '💪',
      '👶',
      '👦',
      '👧',
      '👨',
      '👩',
      '👪',
      '👫',
      '👬',
      '👭',
    ];
    const reactions: { emoji: string; users: mongoose.Types.ObjectId[] }[] = [];

    for (let i = 0; i < 20; i++) {
      reactions.push({
        emoji: emojis[i],
        users: [new mongoose.Types.ObjectId()],
      });
    }

    reactedMessage = await Message.create({
      text: 'Reacted-Message',
      sender: user._id,
      chatId: chat._id,
      reactions: [...reactions],
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
    await Message.deleteMany({});
    await disconnectDatabase();
    io.close();
    server.close();
  });

  it('should toggle reaction', (done) => {
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

          clientSocket.on('message', (message) => {
            expect(message.text).to.equal('new message');

            clientSocket.emit(
              'toggleReaction',
              {
                chatId: chat._id,
                messageId: message._id,
                reaction: '👍',
              },
              (response: { success: boolean }) => {
                expect(response.success).to.be.equal(true);
                clientSocket.disconnect();
                done();
              }
            );
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return missing messageId or reaction during toggle reaction', (done) => {
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

          clientSocket.on('message', (message) => {
            expect(message.text).to.equal('new message');

            clientSocket.emit(
              'toggleReaction',
              {
                chatId: chat._id,
                reaction: '👍',
              },
              (err: { error: string }) => {
                expect(err.error).to.be.equal(
                  'Missing message ID or reaction.'
                );
                clientSocket.disconnect();
                done();
              }
            );
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return reaction must be a valid emoji during toggle reaction', (done) => {
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

          clientSocket.on('message', (message) => {
            expect(message.text).to.equal('new message');

            clientSocket.emit(
              'toggleReaction',
              {
                chatId: chat._id,
                messageId: message._id,
                reaction: 'a',
              },
              (err: { error: string }) => {
                expect(err.error).to.be.equal(
                  'Reaction must be a valid emoji.'
                );
                clientSocket.disconnect();
                done();
              }
            );
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return messag is not found if message ID is incorrect during toggle reaction', (done) => {
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

          clientSocket.on('message', (message) => {
            expect(message.text).to.equal('new message');

            clientSocket.emit(
              'toggleReaction',
              {
                chatId: chat._id,
                messageId: new mongoose.Types.ObjectId(),
                reaction: '👍',
              },
              (err: { error: string }) => {
                expect(err.error).to.be.equal('Message is not found.');
                clientSocket.disconnect();
                done();
              }
            );
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return only one emoji is allowed if user sends more than one emoji during toggle reaction', (done) => {
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

          clientSocket.on('message', (message) => {
            expect(message.text).to.equal('new message');

            clientSocket.emit(
              'toggleReaction',
              {
                chatId: chat._id,
                messageId: message._id,
                reaction: '👍👍',
              },
              (err: { error: string }) => {
                expect(err.error).to.be.equal('Only one emoji is allowed.');
                clientSocket.disconnect();
                done();
              }
            );
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return chat is not found if the message contains an incorrect chat ID during toggle reaction', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleReaction',
          {
            chatId: new mongoose.Types.ObjectId(),
            messageId: fakeMessage._id,
            reaction: '👍',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Chat is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return you are not a member of this chat room if user5 tries to toggle reaction', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token5 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const message = await Message.findOne({
          text: 'new message',
          chatId: chat._id,
        });
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleReaction',
          {
            chatId: chat._id,
            messageId: message._id,
            reaction: '👍',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You are not a member of this chat room.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return too many reactions when user tries to toggle the Reacted-Message', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const message = await Message.findOne({
          text: 'Reacted-Message',
          chatId: chat._id,
        });

        console.log(message, '==================================');
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleReaction',
          {
            chatId: chat._id,
            messageId: message._id,
            reaction: '👍',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Too many reactions.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });
});
