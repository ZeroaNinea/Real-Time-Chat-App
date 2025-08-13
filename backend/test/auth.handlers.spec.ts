import { expect } from 'chai';
import { createServer } from 'http';
import express from 'express';
import request from 'supertest';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { Server } from 'socket.io';

import { connectToDatabase, disconnectDatabase } from '../src/config/db';
import { setupSocket } from '../src/socket';
import { User } from '../src/models/user.model';

describe('Auth Socket Handlers', () => {
  let server: ReturnType<typeof createServer>;
  let app: ReturnType<typeof express>;
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
    console.log(token, '===================================');
    expect(resLogin.status).to.equal(200);
    expect(resLogin.body.username).to.equal('socketuser');

    app = express();
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
});
