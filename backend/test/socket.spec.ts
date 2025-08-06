import { expect } from 'chai';
import { createServer } from 'http';

import express from 'express';
import {
  io as Client,
  type Socket as ClientSocket,
  Socket,
} from 'socket.io-client';
import { Server, type Socket as ServerSocket } from 'socket.io';
import sinon from 'sinon';

import onlineUsersModule from '../src/sockets/helpers/online-users';
import socketHandlers from '../src/sockets';
import socketAuthMiddleware from '../src/middleware/socket-auth.middleware';

// sinon
//   .stub(socketAuthMiddleware, 'socketAuthMiddleware')
//   .callsFake((socket, next) => {
//     socket.data.user = { _id: '123' };
//     next();
//   });

import { setupSocket } from '../src/socket';

describe('setupSocket', () => {
  let server: ReturnType<typeof createServer>;
  let app: ReturnType<typeof express>;
  let address: string;
  let clientSocket: Socket;
  let io: Server;

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

  it('should connect to Socket.IO', (done) => {
    clientSocket = Client(address, {
      auth: { token: 'dummy' },
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => {
      done();
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
////////////////////////////////////////////////////////////////////
// import { expect } from 'chai';
// import sinon from 'sinon';
// import { Server as HttpServer } from 'http';
// import { Server as SocketIOServer } from 'socket.io';
// import { setupSocket } from '../src/socket';
// import { io as ClientSocket } from 'socket.io-client';
// import { app } from '../src/app';

// describe('setupSocket', () => {
//   let httpServer: HttpServer;
//   let io: SocketIOServer;
//   let clientSocket: ReturnType<typeof ClientSocket>;

//   beforeEach((done) => {
//     // Create a mock HTTP server.
//     httpServer = new HttpServer();

//     // Set up the Socket.IO server.
//     io = setupSocket(httpServer, app);

//     // Start the HTTP server.
//     httpServer.listen(() => {
//       const port = (httpServer.address() as any).port;

//       // Connect a client socket.
//       clientSocket = ClientSocket(`http://localhost:${port}`, {
//         transports: ['websocket'],
//       });

//       clientSocket.on('connection', done);
//     });
//   });

//   afterEach((done) => {
//     // Clean up the client socket and server.
//     clientSocket.close();
//     io.close();
//     httpServer.close(done);
//   });

//   // it('should handle client connections', (done) => {
//   //   clientSocket.on('connection', () => {
//   //     expect(clientSocket.connected).to.be.true;
//   //     done();
//   //   });
//   //   done();
//   // });

//   // it('should handle "message" events', (done) => {
//   //   const testMessage = 'Hello, world!';

//   //   // Listen for the "message" event on the server.
//   //   io.on('connection', (socket) => {
//   //     socket.on('message', (data) => {
//   //       expect(data).to.equal(testMessage);
//   //       done();
//   //     });
//   //   });

//   //   // Emit a "message" event from the client.
//   //   clientSocket.emit('message', testMessage);
//   //   done();
//   // });

//   // it('should broadcast "message" events to all clients', (done) => {
//   //   const testMessage = 'Broadcast message';

//   //   // Connect a second client.
//   //   const secondClientSocket = ClientSocket(
//   //     `http://${clientSocket.io.opts.hostname}:${clientSocket.io.opts.port}`,
//   //     {
//   //       transports: ['websocket'],
//   //     }
//   //   );

//   //   secondClientSocket.on('connect', () => {
//   //     secondClientSocket.on('message', (data) => {
//   //       expect(data).to.equal(testMessage);
//   //       secondClientSocket.close();
//   //       done();
//   //     });

//   //     // Emit a "message" event from the first client.
//   //     clientSocket.emit('message', testMessage);
//   //   });
//   // });

//   // it('should handle client disconnections', (done) => {
//   //   clientSocket.on('disconnect', () => {
//   //     expect(clientSocket.connected).to.be.false;
//   //     done();
//   //   });

//   //   clientSocket.close();
//   // });
// });
