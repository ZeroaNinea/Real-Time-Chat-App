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

import userHelper from '../src/helpers/user-helper';

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

  it('should return you are banned by the user', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        user.banlist.push(user2._id);
        await user.save();
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user2._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are banned by the user.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is banned', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        user2.banlist.push(user._id);
        await user2.save();
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user2._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('User is banned.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should send a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        user.banlist = [];
        user2.banlist = [];
        await user2.save();
        await user.save();

        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user2._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('notification', (notification) => {
          expect(notification.type).to.be.equal('friend-request');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is not found if receiverId is invalid', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: new mongoose.Types.ObjectId(),
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('User is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should try to send a friend request again and get friend request already sent', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user2._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Friend request already sent.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return cannot send friend request to yourself', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'Cannot send friend request to yourself.'
            );

            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return already friends', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        user.friends.push(user2._id);
        user2.friends.push(user._id);
        await user.save();
        await user2.save();

        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user2._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Already friends.');

            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during sending a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon
          .stub(userHelper, 'findUserById')
          .throws(new Error('DB down'));
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user2._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'Server error during sending a friend request.'
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

  it('should return user is not found during declining a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(userHelper, 'findUserById').resolves(null);
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'declineFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('User is not found.');
            stub.restore();
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during declining a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon
          .stub(userHelper, 'findUserById')
          .throws(new Error('DB down'));
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'declineFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'Server error during declining a friend request.'
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

  it('should allow user2 to decline the friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'declineFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.emit('joinChatRoom', { chatId: user._id });

        clientSocket.on('roomJoined', async ({ chatId }) => {
          expect(chatId).to.equal(user._id.toString());

          clientSocket.on('notification', (notification) => {
            expect(notification.message).to.equal(
              'socketuser2 declined your friend request'
            );
            clientSocket.disconnect();
            done();
          });
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return friend request is not found during declining the friend request again', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'declineFriendRequest',
          {
            notificationId: new mongoose.Types.ObjectId().toString(),
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Friend request is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return invalid friend ID if friend ID is not valid during removing friend', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'removeFriend',
          { friendId: new mongoose.Types.ObjectId().toString() },
          (err: { error: string }) => {
            expect(err.error).to.equal('Invalid friend ID.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is not found if there is no user with the given ID during removing friend', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'removeFriend',
          new mongoose.Types.ObjectId().toString(),
          (err: { error: string }) => {
            expect(err.error).to.equal('User is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during removing friend', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(User, 'updateOne').throws(new Error('DB down'));
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'removeFriend',
          user2._id,
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'Server error during removing a friend.'
            );
            stub.restore();
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should remove friend', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'removeFriend',
          user2._id,
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('friendRemovedByOther', (data: { userId: string }) => {
          expect(data.userId).to.equal(user._id.toString());
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should send a friend request in the second time', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'sendFriendRequest',
          {
            receiverId: user2._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('notification', (notification) => {
          expect(notification.type).to.be.equal('friend-request');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is not found during accepting a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(userHelper, 'findUserById').resolves(null);
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'acceptFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('User is not found.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('it should return a server error during accepting a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon
          .stub(userHelper, 'findUserById')
          .throws(new Error('DB down'));
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'acceptFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'Server error during accepting a friend request.'
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

  it('should return friend request is not found during accepting the friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(userHelper, 'findUserById').resolves({
          _id: user._id,
        });
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'acceptFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Friend request is not found.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return cannot accept friend request from yourself', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const mockUser = user;
        mockUser.pendingRequests.push(user._id.toString());
        const stub = sinon.stub(userHelper, 'findUserById').resolves(mockUser);
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'acceptFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You cannot accept friend request from yourself.'
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

  it('should accept a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const notification = await Notification.findOne({
          sender: user._id,
          recipient: user2._id,
        });
        expect(chatId).to.equal(user._id.toString());

        console.log(user, user2);

        clientSocket.emit(
          'acceptFriendRequest',
          {
            notificationId: notification._id,
            senderId: user._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('friendAddedByOther', (user) => {
          expect(user.username).to.be.equal('socketuser2');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return you are banned by the user during accepting a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const fakeUser2 = user2;
        const fakeUser = user;
        fakeUser.pendingRequests.push(user2._id.toString());
        fakeUser.banlist.push(user2._id.toString());

        const stub = sinon.stub(userHelper, 'findUserById');
        stub.onCall(0).resolves(fakeUser);
        stub.onCall(1).resolves(fakeUser2);

        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'acceptFriendRequest',
          {
            notificationId: new mongoose.Types.ObjectId().toString(),
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are banned by the user.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is banned during accepting a friend request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const fakeUser2 = user2;
        fakeUser2.banlist.push(user._id.toString());

        const fakeUser = user;
        fakeUser.pendingRequests.push(user2._id.toString());

        const stub = sinon.stub(userHelper, 'findUserById');
        stub.onCall(0).resolves(fakeUser);
        stub.onCall(1).resolves(fakeUser2);

        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'acceptFriendRequest',
          {
            notificationId: new mongoose.Types.ObjectId().toString(),
            senderId: user._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('User is banned.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return invalid user ID during banning a user', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'banUser',
          { userId: new mongoose.Types.ObjectId().toString() },
          (err: { error: string }) => {
            expect(err.error).to.equal('Invalid user ID.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return you cannot ban yourself', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit('banUser', user._id, (err: { error: string }) => {
          expect(err.error).to.equal('You cannot ban yourself.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is not found during banning a user', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'banUser',
          new mongoose.Types.ObjectId().toString(),
          (err: { error: string }) => {
            expect(err.error).to.equal('User is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during banning a user', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(User, 'updateOne').throws(new Error('DB down'));
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit('banUser', user2._id, (err: { error: string }) => {
          expect(err.error).to.equal('Server error during banning a user.');
          clientSocket.disconnect();
          stub.restore();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should ban user2', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'banUser',
          user2._id,
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is already banned', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit('banUser', user2._id, (err: { error: string }) => {
          expect(err.error).to.equal('User is already banned.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during unbanning a user', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      const stub = sinon.stub(User, 'updateOne').throws(new Error('DB down'));
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit('unbanUser', user2._id, (err: { error: string }) => {
          expect(err.error).to.equal('Server error during unbanning a user.');
          clientSocket.disconnect();
          stub.restore();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should unban user 2', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'unbanUser',
          user2._id,
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return invalid user ID during unbanning a user', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'unbanUser',
          { userId: new mongoose.Types.ObjectId().toString() },
          (err: { error: string }) => {
            expect(err.error).to.equal('Invalid user ID.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return you cannot unban yourself', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit('unbanUser', user._id, (err: { error: string }) => {
          expect(err.error).to.equal('You cannot unban yourself.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is not found during unbanning a user', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'unbanUser',
          new mongoose.Types.ObjectId(),
          (err: { error: string }) => {
            expect(err.error).to.equal('User is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user is not banned during unbanning a user again', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit('unbanUser', user2._id, (err: { error: string }) => {
          expect(err.error).to.equal('User is not banned.');
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return invalid data provided during a private chat deletion request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'deletePrivateChatRequest',
          {
            receiverId: user2._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Invalid data provided.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should send a delete private chat request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'deletePrivateChatRequest',
          {
            receiverId: user2._id,
            chatId: privateChat._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('notification', async (response) => {
          const notification = await Notification.findOne({
            message: 'socketuser wants to delete you private chat',
          });
          expect(response.message).to.equal(notification.message);
          expect(response.type).to.equal(notification.type);
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return deleting request is already sent during a private chat deletion request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'deletePrivateChatRequest',
          {
            receiverId: user2._id,
            chatId: privateChat._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Deletion request is already sent.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user 3 to send a deletion request because they are not a member of the private chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token3 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'deletePrivateChatRequest',
          {
            receiverId: user2._id,
            chatId: privateChat._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You are not authorized to delete this chat.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return deletion request is already send by stubing the user data', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon.stub(userHelper, 'findUserById');

        const fakeUser = user;
        fakeUser.deletionRequests = [];

        stub.onCall(0).resolves(fakeUser);
        stub.onCall(1).resolves(user2);

        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'deletePrivateChatRequest',
          {
            receiverId: user2._id,
            chatId: privateChat._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Deletion request is already sent.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during sending a private chat deletion request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user2._id });

      clientSocket.on('roomJoined', async ({ chatId }) => {
        const stub = sinon
          .stub(userHelper, 'findUserById')
          .throws(new Error('DB down'));
        expect(chatId).to.equal(user2._id.toString());

        clientSocket.emit(
          'deletePrivateChatRequest',
          {
            receiverId: user2._id,
            chatId: privateChat._id,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Server error during deletion request.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return deletion request is not found during declining a private chat deletion request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        const stub = sinon
          .stub(Notification, 'findOneAndDelete')
          .resolves(null);
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'declinePrivateChatDeletion',
          {
            recipientId: user._id,
            chatId: new mongoose.Types.ObjectId(),
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Deletion request is not found.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should decline a private chat deletion request', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token2 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: user._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(user._id.toString());

        clientSocket.emit(
          'declinePrivateChatDeletion',
          {
            recipientId: user._id,
            chatId: privateChat._id,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });
});
