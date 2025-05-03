import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Express } from 'express';

// This function sets up the Socket.io server and handles events.
export function setupSocket(server: HttpServer, app: Express) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    console.log('A user connected.');

    socket.on('message', (data) => {
      console.log('Received:', data);
      io.emit('message', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected.');
    });

    socket.on('joinChatRoom', (chatId: string) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room ${chatId}`);
    });
  });

  return io;
}
