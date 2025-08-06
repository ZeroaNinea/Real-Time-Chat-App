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

sinon.stub(authMiddleware, 'socketAuthMiddleware').returns((socket, next) => {
  socket.data.user = { _id: '123' };
  next();
});

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

    // sinon.stub(jwt, 'decode').returns({ header: { kid: 'abc' } });
    // sinon
    //   .stub(fs, 'readFileSync')
    //   .returns(JSON.stringify({ abc: 'publicKey' }));
    // sinon.stub(jwt, 'verify').callsFake(() => {
    //   return { id: '123' };
    // });
    // sinon
    //   .stub(userService, 'findUserById')
    //   .resolves({ _id: '123', username: 'testuser' });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).to.be.true;
      done();
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });

  // it('should connect and emit join/chat events', (done) => {
  //   clientSocket = Client(address, {
  //     auth: { token: 'dummy' },
  //     transports: ['websocket'],
  //   });

  //   clientSocket.on('connect', () => {
  //     clientSocket.emit('joinChatRoom', { chatId: 'abc' });

  //     clientSocket.on('roomJoined', ({ chatId }) => {
  //       expect(chatId).to.equal('abc');
  //       done();
  //     });
  //   });

  //   done();
  // });

  // it('should emit online/offline events', (done) => {
  //   const broadcastSpy = sinon.spy();

  //   const io = app.get('io');
  //   io.on('connection', (socket: any) => {
  //     socket.broadcast.emit = broadcastSpy;

  //     socket.disconnect();

  //     setTimeout(() => {
  //       expect(broadcastSpy.calledWith('userOnline', '123')).to.be.true;
  //       expect(broadcastSpy.calledWith('userOffline', '123')).to.be.true;
  //       done();
  //     }, 50);
  //   });

  //   clientSocket = Client(address, {
  //     auth: { token: 'dummy' },
  //     transports: ['websocket'],
  //   });

  //   done();
  // });
});
