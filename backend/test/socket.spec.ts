import { expect } from 'chai';
import { createServer } from 'http';
import { setupSocket } from '../src/socket';
import express from 'express';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Socket } from 'socket.io';
import sinon from 'sinon';

import onlineUsersModule from '../src/sockets/helpers/online-users';
import socketHandlers from '../src/sockets';

describe('setupSocket', () => {
  let server: ReturnType<typeof createServer>;
  let app: ReturnType<typeof express>;
  let address: string;
  let clientSocket: ClientSocket;

  beforeEach((done) => {
    app = express();
    server = createServer(app);
    const io = setupSocket(server, app);

    server.listen(() => {
      const port = (server.address() as any).port;
      address = `http://localhost:${port}`;
      done();
    });

    io.use((socket, next) => {
      socket.data.user = { _id: '123' };
      next();
    });

    sinon.stub(onlineUsersModule, 'addUserSocket').callThrough();
    sinon.stub(onlineUsersModule, 'removeUserSocket').returns(true);
    sinon.stub(socketHandlers, 'registerSocketHandlers');
  });

  afterEach((done) => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    sinon.restore();
    server.close(done);
  });

  it('should connect and emit join/chat events', (done) => {
    clientSocket = Client(address, {
      auth: { token: 'dummy' },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinChatRoom', { chatId: 'abc' });

      clientSocket.on('roomJoined', ({ chatId }) => {
        expect(chatId).to.equal('abc');
        done();
      });
    });

    done();
  });

  it('should emit online/offline events', (done) => {
    const broadcastSpy = sinon.spy();

    const io = app.get('io');
    io.on('connection', (socket: Socket) => {
      socket.broadcast.emit = broadcastSpy;

      socket.disconnect();

      setTimeout(() => {
        expect(broadcastSpy.calledWith('userOnline', '123')).to.be.true;
        expect(broadcastSpy.calledWith('userOffline', '123')).to.be.true;
        done();
      }, 50);
    });

    clientSocket = Client(address, {
      auth: { token: 'dummy' },
      transports: ['websocket'],
    });
  });
});
