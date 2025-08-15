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
    await disconnectDatabase();
    io.close();
    server.close();
  });

  it('should add a new channel', (done) => {
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
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should emit error when the chat is not found', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit('addChannel', {
          chatId: new mongoose.Types.ObjectId(),
          channelName: 'newchannel',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('Chat not found.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return you are not a member of this chat during channel addition', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
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

        clientSocket.on('error', (err) => {
          expect(err).to.equal('You are not a member of this chat.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return private chat rooms cannot have channels', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit('addChannel', {
          chatId: privateChat._id,
          channelName: 'newchannel',
        });

        clientSocket.on('error', (err) => {
          expect(err).to.equal('Private chat rooms cannot have channels.');
          clientSocket.disconnect();
          done();
        });
      });
    });
  });

  it('should allow user3 to create a channel', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token3 },
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
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user4 to create a channel', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
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

        clientSocket.on('error', (err) => {
          expect(err).to.equal('You are not allowed to add channels.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should edit channel topic', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editChannelTopic',
          {
            channelId: channel._id,
            topic: 'new topic',
          },
          (response: any) => {
            expect(response.success).to.be.true;
            expect(response.channel.topic).to.equal('new topic');
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('channelEdited', (response) => {
          expect(response._id.toString()).to.equal(channel._id.toString());
          expect(response.topic).to.equal('new topic');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return channel is not found when editing channel topic', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editChannelTopic',
          {
            channelId: new mongoose.Types.ObjectId(),
            topic: 'new topic',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Channel is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return chat is not found when editing channel topic', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', {
        chatId: chat._id.toString(),
      });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });
        const stub = sinon.stub(Chat, 'findById').resolves(null);

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editChannelTopic',
          {
            channelId: channel._id,
            topic: 'new topic',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Chat is not found.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user4 to edit channel topic', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editChannelTopic',
          {
            channelId: channel._id,
            topic: 'new topic',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to edit channels.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user2 to edit channel topic because they are not a member of the chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editChannelTopic',
          {
            channelId: channel._id,
            topic: 'new topic',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not a member of this chat.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('stould return a server error during channel topic editing', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon
          .stub(Channel, 'findById')
          .throws(new Error('DB down'));
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editChannelTopic',
          {
            channelId: channel._id,
            topic: 'new topic',
          },
          (err: any) => {
            expect(err.error).to.equal(
              'Server error during channel topic update.'
            );
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should rename the channel', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'renameChannel',
          {
            channelId: channel._id,
            name: 'newchannel',
          },
          (response: { success: boolean; channel: typeof Channel }) => {
            expect(response.success).to.equal(true);
            expect(response.channel._id.toString()).to.equal(
              channel._id.toString()
            );
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('channelEdited', (response) => {
          expect(response._id.toString()).to.equal(channel._id.toString());
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail rename the channel if the channel is not found', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'renameChannel',
          {
            channelId: new mongoose.Types.ObjectId(),
            name: 'newchannel',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Channel is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail rename the channel if the chat is not found', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(Chat, 'findById').resolves(null);
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'renameChannel',
          {
            channelId: channel._id,
            name: 'newchannel',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Chat is not found.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user2 to rename channel because they are not a member of the chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'renameChannel',
          {
            channelId: channel._id,
            name: 'newchannel',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not a member of this chat.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user4 to rename channel', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'renameChannel',
          {
            channelId: channel._id,
            name: 'newchannel',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to edit channels.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should update channel permissinos', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'updateChannelPermissions',
          {
            channelId: channel._id,
            permissions: { adminsOnly: true },
          },
          (response: { success: boolean; channel: typeof Channel }) => {
            expect(response.success).to.equal(true);
            expect(response.channel._id.toString()).to.equal(
              channel._id.toString()
            );
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('channelUpdated', (response) => {
          expect(response._id.toString()).to.equal(channel._id.toString());
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return channel is not found during updating channel permissions', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'updateChannelPermissions',
          {
            channelId: new mongoose.Types.ObjectId(),
            permissions: { adminsOnly: true },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Channel is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should rutern chat is not found during updating channel permissions', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(Chat, 'findById').resolves(null);
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'updateChannelPermissions',
          {
            channelId: channel._id,
            permissions: { adminsOnly: true },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Chat is not found.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user2 to update channel permissions because they are not a member of the chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'updateChannelPermissions',
          {
            channelId: channel._id,
            permissions: { adminsOnly: true },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not a member of this chat.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it("should not allow user4 to update channel permissions because they don't have permissions", (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'updateChannelPermissions',
          {
            channelId: channel._id,
            permissions: { adminsOnly: true },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to edit channels.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should change channel order', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        clientSocket.emit('addChannel', {
          chatId: chat._id,
          channelName: 'newchannel2',
        });

        clientSocket.on('channelAdded', async (newChannel) => {
          expect(newChannel.name).to.equal('newchannel2');

          const channels = await Channel.find({ chatId: chat._id });
          const channel = channels[0];
          const channel2 = channels[1];
          const channel3 = channels[2];

          expect(chatId).to.equal(chat._id.toString());

          clientSocket.emit(
            'changeChannelOrder',
            {
              channelIds: [channel2._id, channel._id, channel3._id],
              chatId: chat._id,
            },
            (response: { success: boolean; channels: (typeof Channel)[] }) => {
              expect(response.success).to.be.true;
              expect(response.channels[0]._id.toString()).to.equal(
                channel2._id.toString()
              );
              expect(response.channels[1]._id.toString()).to.equal(
                channel._id.toString()
              );
              expect(response.channels[2]._id.toString()).to.equal(
                channel3._id.toString()
              );
              clientSocket.disconnect();
              done();
            }
          );

          clientSocket.on('channelsUpdated', (response) => {
            expect(response[0]._id.toString()).to.equal(
              channel2._id.toString()
            );
            expect(response[1]._id.toString()).to.equal(channel._id.toString());
            clientSocket.disconnect();
            expect(response[2]._id.toString()).to.equal(
              channel3._id.toString()
            );
            done();
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return chat is not found during channel order change', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        const channels = await Channel.find({ chatId: chat._id });
        const channel = channels[0];
        const channel2 = channels[1];
        const channel3 = channels[2];

        clientSocket.emit(
          'changeChannelOrder',
          {
            channelIds: [channel2._id, channel._id, channel3._id],
            chatId: new mongoose.Types.ObjectId(),
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

  it('should not allow user2 to change the channel order because they are not a member of the chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        const channels = await Channel.find({ chatId: chat._id });
        const channel = channels[0];
        const channel2 = channels[1];
        const channel3 = channels[2];

        clientSocket.emit(
          'changeChannelOrder',
          {
            channelIds: [channel2._id, channel._id, channel3._id],
            chatId: chat._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not a member of this chat.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user4 to change the channel order because they do not have required permissions', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        const channels = await Channel.find({ chatId: chat._id });
        const channel = channels[0];
        const channel2 = channels[1];
        const channel3 = channels[2];

        clientSocket.emit(
          'changeChannelOrder',
          {
            channelIds: [channel2._id, channel._id, channel3._id],
            chatId: chat._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You are not allowed to change the channel order.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return channel order is invalid during channel order change', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        const channels = await Channel.find({ chatId: chat._id });
        const channel = channels[0];
        const channel2 = channels[1];

        clientSocket.emit(
          'changeChannelOrder',
          {
            channelIds: [channel._id, channel2._id],
            chatId: chat._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Invalid channel order.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during channel deletion', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon
          .stub(Channel, 'findById')
          .throws(new Error('DB down'));

        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'deleteChannel',
          {
            channelId: channel._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Server error during channel deletion.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user2 to delete a channel because they are not a member of the chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'deleteChannel',
          {
            channelId: channel._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not a member of this chat.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return channel is not found', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'deleteChannel',
          {
            channelId: new mongoose.Types.ObjectId(),
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Channel is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user4 to delete a channel', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'deleteChannel',
          {
            channelId: channel._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You are not allowed to delete channels.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should delete the channel', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const channel = await Channel.findOne({ name: 'newchannel' });

        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'deleteChannel',
          {
            channelId: channel._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('channelDeleted', (response) => {
          expect(response.channelId.toString()).to.equal(
            channel._id.toString()
          );
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });
});
