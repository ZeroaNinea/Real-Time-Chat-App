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

  it('should create a new role', (done) => {
    clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'createRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (response: { success: boolean; updatedRole: Role }) => {
            expect(response.success).to.equal(true);
            expect(response.updatedRole.name).to.equal('newrole');
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('chatUpdated', (response) => {
          expect(response._id.toString()).to.equal(chat._id.toString());
          clientSocket.disconnect();
          done();
        });
      });
    });
  });

  it('should return chat is not found during creating role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'createRole',
          {
            chatId: new mongoose.Types.ObjectId(),
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Chat is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should not allow to create a role called Admin', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'createRole',
          {
            chatId: chat._id,
            role: {
              name: 'Admin',
              description: 'Admin',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You cannot create roles called Owner, Admin or Moderator.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should not allow user4 to create a role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'createRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to create roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow to create a role with a permission canDeleteChatroom', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'createRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
              permissions: ['canDeleteChatroom'],
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You cannot create roles equal to or greater than your own.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should return a server error during role creation', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'createRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Server error during role creation.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to create a role in the private chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit(
          'createRole',
          {
            chatId: privateChat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Private chat rooms cannot have roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should edit the role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (response: { success: boolean; updatedRole: Role }) => {
            expect(response.success).to.equal(true);
            expect(response.updatedRole.name).to.equal('newrole');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should return chat is not found during editing role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: new mongoose.Types.ObjectId(),
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Chat is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should not allow user4 to edit role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to edit roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow to edit the Admin role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: chat._id,
            role: {
              name: 'Admin',
              description: 'Admin',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You cannot edit default roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should not allow to add the canDeleteChatroom permisson to the newrole', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
              permissions: ['canDeleteChatroom'],
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You cannot edit permissions equal to or greater than your own.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });
  });

  it('should edit the Channel-Creator role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: chat._id,
            role: {
              name: 'Channel-Creator',
              description: 'Channel-Creator',
            },
          },
          (response: { success: boolean; updatedRole: Role }) => {
            expect(response.success).to.equal(true);
            expect(response.updatedRole.name).to.equal('Channel-Creator');
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('roleEdited', (response) => {
          expect(response._id).to.equal(chat._id.toString());
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during role editing', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: chat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Server error during role update.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to edit a role in a private chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit(
          'editRole',
          {
            chatId: privateChat._id,
            role: {
              name: 'newrole',
              description: 'newrole',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Private chat rooms cannot have roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should assign role Cute-Role to user3', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user3._id,
            role: {
              name: 'Cute-Role',
              description: 'Cute-Role',
            },
          },
          (response: { success: boolean; member: Member }) => {
            console.log(response);
            expect(response.success).to.equal(true);
            expect(response.member.user.toString()).to.equal(
              user3._id.toString()
            );
            expect(response.member.roles.includes('Cute-Role')).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('memberUpdated', (response) => {
          expect(response.user.toString()).to.equal(user3._id.toString());
          expect(response.roles.includes('Cute-Role')).to.equal(true);
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return user not found during role assignment', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: new mongoose.Types.ObjectId(),
            role: {
              name: 'Cute-Role',
              description: 'Cute-Role',
            },
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

  it('should return chat is not found during role assignment', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: new mongoose.Types.ObjectId(),
            userId: user3._id,
            role: {
              name: 'Cute-Role',
              description: 'Cute-Role',
            },
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

  it('should not allow user4 to assign a role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user3._id,
            role: {
              name: 'Cute-Role',
              description: 'Cute-Role',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to assign roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user3 to assign a Moderator role to user4', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token3 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user4._id,
            role: {
              name: 'Moderator',
              description: 'Moderator',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You are not allowed to assign moderators.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user3 to assign an Admin role to user4', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token3 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user4._id,
            role: {
              name: 'Admin',
              description: 'Admin',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to assign admins.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow userModerator to assign an Admin role to user3', (done) => {
    const clientSocket = Client(address, {
      auth: { token: tokenModerator },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user3._id,
            role: {
              name: 'Admin',
              description: 'Admin',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You cannot edit assign higher or equal to your own.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not find the member of the chat when user triet to assign the Cute-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token3 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        const stub = sinon.stub(User, 'findById').resolves({
          _id: new mongoose.Types.ObjectId(),
          username: 'fakeUser',
        });
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: new mongoose.Types.ObjectId(),
            role: {
              name: 'Cute-Role',
              description: 'Cute-Role',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Member is not found.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to assign the Cute-Role to user3 again', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user3._id,
            role: {
              name: 'Cute-Role',
              description: 'Cute-Role',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('User already has this role.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should throw a server error during role assignment', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        const stub = sinon.stub(Chat, 'findById').rejects(new Error('DB down'));
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user3._id,
            role: {
              name: 'Cute-Role',
              description: 'Cute-Role',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Server error during role assignment.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to assign a non-existing role to user3', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'assignRole',
          {
            chatId: chat._id,
            userId: user3._id,
            role: {
              name: 'Fake-Role',
              description: 'Fake-Role',
            },
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Role is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should toggle the Toggle-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Toggle-Role',
            selected: true,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('memberUpdated', (response) => {
          expect(response.roles.includes('Toggle-Role')).to.equal(true);
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return chat is not found during toggling role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: new mongoose.Types.ObjectId(),
            roleName: 'Toggle-Role',
            selected: true,
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

  it('should fail to toggle role in the private chat', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: privateChat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(privateChat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: privateChat._id,
            roleName: 'Toggle-Role',
            selected: true,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Private chat rooms cannot have roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user5 to toggle the role because they are not a member', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token5 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Toggle-Role',
            selected: true,
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

  it('should not allow to toggle a non-existing role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Fake-Role',
            selected: true,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Role is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to toggle the Admin role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Admin',
            selected: true,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You cannot toggle default roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow to toggle the ID-Restricted-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'ID-Restricted-Role',
            selected: true,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You are not allowed to assign yourself this role.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to toggle the Role-Restricted-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Role-Restricted-Role',
            selected: true,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You do not meet the requirements to assign this role.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to toggle the Cute-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Cute-Role',
            selected: true,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'This role cannot be assigned to yourself.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to toggle the Broken-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Broken-Role',
            selected: true,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You cannot toggle permissions equal to or greater than your own.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should toggle the Toggle-Role again', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Toggle-Role',
            selected: false,
          },
          (response: { success: boolean }) => {
            expect(response.success).to.equal(true);
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('memberUpdated', (response) => {
          expect(response.roles.includes('Toggle-Role')).to.equal(false);
        });
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return a server error during role toggle', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        const stub = sinon.stub(Chat, 'findById').throws(new Error('DB down'));
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'toggleRole',
          {
            chatId: chat._id,
            roleName: 'Toggle-Role',
            selected: false,
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Server error during role toggle.');
            clientSocket.disconnect();
            stub.restore();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should return chat is not found during removing role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'removeRole',
          {
            userId: user._id,
            chatId: new mongoose.Types.ObjectId(),
            role: 'Removing-Role',
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

  it('should return member is not found with an incorrect userId', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'removeRole',
          {
            userId: new mongoose.Types.ObjectId(),
            chatId: chat._id,
            role: 'Removing-Role',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('Member is not found.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should not allow user4 to remove the Removing-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token4 },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'removeRole',
          {
            userId: user._id,
            chatId: chat._id,
            role: 'Removing-Role',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal('You are not allowed to remove roles.');
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should fail to remove the Owner role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'removeRole',
          {
            userId: user._id,
            chatId: chat._id,
            role: 'Owner',
          },
          (err: { error: string }) => {
            expect(err.error).to.equal(
              'You cannot remove roles higher or equal to your own.'
            );
            clientSocket.disconnect();
            done();
          }
        );
      });
    });

    clientSocket.on('connect_error', done);
  });

  it('should romove the Removing-Role', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: chat._id });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal(chat._id.toString());

        clientSocket.emit(
          'removeRole',
          {
            userId: user._id,
            chatId: chat._id,
            role: 'Removing-Role',
          },
          (response: { success: boolean; member: Member }) => {
            expect(response.success).to.equal(true);
            expect(response.member.roles.includes('Removing-Role')).to.equal(
              false
            );
            clientSocket.disconnect();
            done();
          }
        );

        clientSocket.on('memberUpdated', (response) => {
          expect(response.roles.includes('Removing-Role')).to.equal(false);
          clientSocket.disconnect();
          done();
        });
      });
    });

    clientSocket.on('connect_error', done);
  });
});
