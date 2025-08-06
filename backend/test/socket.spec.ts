import { expect } from 'chai';
import { createServer } from 'http';
import express from 'express';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import sinon from 'sinon';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import fs from 'fs';

import authMiddleware from '../src/middleware/socket-auth.middleware';
import onlineUsersModule from '../src/sockets/helpers/online-users';
import socketHandlers from '../src/sockets';
import { setupSocket } from '../src/socket';
import userService from '../src/services/user.service';

describe('setupSocket', () => {
  let server: ReturnType<typeof createServer>;
  let app: ReturnType<typeof express>;
  let address: string;
  let clientSocket: ClientSocket;
  let io: Server;

  beforeEach((done) => {
    app = express();
    server = createServer(app);
    io = setupSocket(server, app);

    server.listen(() => {
      const port = (server.address() as any).port;
      address = `http://localhost:${port}`;
      done();
    });

    sinon
      .stub(authMiddleware, 'socketAuthMiddleware')
      .callsFake(async (socket, next) => {
        socket.data.user = { _id: '123' };
        next();
      });

    sinon.stub(onlineUsersModule, 'addUserSocket').callThrough();
    sinon.stub(onlineUsersModule, 'removeUserSocket').returns(true);
    sinon.stub(socketHandlers, 'registerSocketHandlers');
    sinon.stub(jwt, 'decode').returns({ header: { kid: 'abc' } });
    sinon
      .stub(fs, 'readFileSync')
      .returns(JSON.stringify({ abc: 'publicKey' }));
    sinon.stub(jwt, 'verify').callsFake(() => ({ id: '123' }));
    sinon
      .stub(userService, 'findUserById')
      .resolves({ _id: '123', username: 'testuser' });
  });

  afterEach((done) => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    sinon.restore();
    server.close(done);
  });

  it('should connect to Socket.IO', (done) => {
    clientSocket = Client(address, {
      auth: { token: 'dummy' },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).to.be.true;
      done();
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });

  it('should join a chat room and a channel', (done) => {
    clientSocket = Client(address, {
      auth: { token: 'dummy' },
      transports: ['websocket'],
    });

    clientSocket.on('connect', async () => {
      clientSocket.emit('joinChatRoom', { chatId: 'abc' });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal('abc');
        done();
      });

      clientSocket.emit('joinChannel', { channelId: 'def' });

      clientSocket.on('channelJoined', ({ channelId }) => {
        expect(channelId).to.equal('def');
        done();
      });
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });
});
