import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Express } from 'express';

import { addChannel, updateChannel } from './controllers/chat.controller';
import { addChannelService } from './services/chat.service';

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

    socket.on('editChannel', ({ chatId, channel }) => {
      updateChannel(chatId, channel)
        .then(() => {
          io.to(chatId).emit('channelEdited', { channel });
        })
        .catch((err: unknown) => {
          console.error('Channel update failed:', err);
        });
    });

    // socket.on('addChannel', async ({ chatId, channelName }) => {
    //   try {
    //     const newChannel = await addChannel(chatId, channelName);
    //     io.to(chatId).emit('channelAdded', { channel: newChannel });
    //   } catch (err) {
    //     console.error('Channel addition failed:', err);
    //     socket.emit('error', 'Channel creation failed.');
    //   }
    // });
    socket.on('addChannel', async ({ chatId, channelName }) => {
      try {
        // You need to authenticate this socket and extract userId!
        const userId = socket.data.user._id;

        const newChannel = await addChannelService(chatId, channelName, userId);
        io.to(chatId).emit('channelAdded', { channel: newChannel });
      } catch (err) {
        console.error('Channel addition failed:', err);
        socket.emit('error', (err as Error).message);
      }
    });
  });

  return io;
}
