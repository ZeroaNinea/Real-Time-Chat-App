import { expect } from 'chai';
import { createServer } from 'http';
import sinon from 'sinon';
import request from 'supertest';

import { app } from '../src/app';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Server } from 'socket.io';

import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { setupSocket } from '../src/socket';
import { User } from '../src/models/user.model';
import userHelper from '../src/helpers/user-helper';

describe('Auth Socket Handlers', () => {
  let server: ReturnType<typeof createServer>;
  let address: string;
  let clientSocket: ClientSocket;
  let io: Server;
  let user: typeof User;
  let token: string;

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

    server = createServer(app);
    io = setupSocket(server, app);

    await new Promise<void>((resolve) => {
      server.listen(() => {
        const port = (server.address() as any).port;
        address = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await User.deleteMany({});
    await disconnectDatabase();
    io.close();
    server.close();
  });

  it('should edit status', (done) => {
    const clientSocket = Client(address, {
      auth: { token: token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit(
        'editStatus',
        { status: 'Online from test' },
        (response: any) => {
          expect(response.success).to.be.true;
          expect(response.user.status).to.equal('Online from test');
          clientSocket.disconnect();
          done();
        }
      );
    });

    clientSocket.on('connect_error', done);
  });

  it('should handle server error during status update', (done) => {
    const stub = sinon.stub(userHelper, 'findUserById').resolves(null);

    const clientSocket = Client(address, {
      auth: { token },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit(
        'editStatus',
        { status: 'Broken test' },
        (response: any) => {
          expect(response).to.have.property(
            'error',
            'Server error during status update.'
          );
          stub.restore();
          clientSocket.disconnect();
          done();
        }
      );
    });

    clientSocket.on('connect_error', done);
  });
});
