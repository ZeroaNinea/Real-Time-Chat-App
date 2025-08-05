import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Express } from 'express';

import { socketAuthMiddleware } from './middleware/socket-auth.middleware';
import { registerSocketHandlers } from './sockets';
import {
  addUserSocket,
  removeUserSocket,
  onlineUsers,
} from './sockets/helpers/online-users';

export function setupSocket(server: HttpServer, app: Express) {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:4200', 'https://real-time-chat-app.local'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  app.set('io', io);

  io.on('connection', (socket) => {
    const userId = socket.data.user._id.toString();

    addUserSocket(userId, socket.id);

    socket.broadcast.emit('userOnline', userId);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    registerSocketHandlers(io, socket);

    socket.on('disconnect', () => {
      if (removeUserSocket(userId, socket.id)) {
        socket.broadcast.emit('userOffline', userId);
      }
    });

    socket.on('joinChatRoom', ({ chatId }) => {
      socket.join(chatId);
      socket.emit('roomJoined', { chatId });
    });

    socket.on('joinChannel', ({ chatId, channelId }) => {
      socket.join(`${chatId}:${channelId}`);
    });
  });

  return io;
}
