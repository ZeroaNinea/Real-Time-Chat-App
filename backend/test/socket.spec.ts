import { expect } from 'chai';
import sinon from 'sinon';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocket } from '../src/socket';
import { io as ClientSocket } from 'socket.io-client';
import { app } from '../src/app';

describe('setupSocket', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let clientSocket: ReturnType<typeof ClientSocket>;

  beforeEach((done) => {
    // Create a mock HTTP server.
    httpServer = new HttpServer();

    // Set up the Socket.IO server.
    io = setupSocket(httpServer, app);

    // Start the HTTP server.
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;

      // Connect a client socket.
      clientSocket = ClientSocket(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', done);
    });
  });

  afterEach((done) => {
    // Clean up the client socket and server.
    clientSocket.close();
    io.close();
    httpServer.close(done);
  });

  it('should handle client connections', (done) => {
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).to.be.true;
      done();
    });
    done();
  });

  it('should handle "message" events', (done) => {
    const testMessage = 'Hello, world!';

    // Listen for the "message" event on the server.
    io.on('connection', (socket) => {
      socket.on('message', (data) => {
        expect(data).to.equal(testMessage);
        done();
      });
    });

    // Emit a "message" event from the client.
    clientSocket.emit('message', testMessage);
    done();
  });

  it('should broadcast "message" events to all clients', (done) => {
    const testMessage = 'Broadcast message';

    // Connect a second client.
    const secondClientSocket = ClientSocket(
      `http://${clientSocket.io.opts.hostname}:${clientSocket.io.opts.port}`,
      {
        transports: ['websocket'],
      }
    );

    secondClientSocket.on('connect', () => {
      secondClientSocket.on('message', (data) => {
        expect(data).to.equal(testMessage);
        secondClientSocket.close();
        done();
      });

      // Emit a "message" event from the first client.
      clientSocket.emit('message', testMessage);
    });
  });

  it('should handle client disconnections', (done) => {
    clientSocket.on('disconnect', () => {
      expect(clientSocket.connected).to.be.false;
      done();
    });

    clientSocket.close();
  });
});
