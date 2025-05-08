import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Express } from 'express';

import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

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

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      // Decode the token header to get the `kid`.
      const decodedHeader = jwt.decode(token, { complete: true }) as {
        header: { kid: string };
      };

      const kid = decodedHeader?.header?.kid;
      if (!kid) throw new Error('Token missing "kid"');

      // Load the key map.
      const keyMapPath = path.join(__dirname, '../keys/key-map.json');
      const keyMap = JSON.parse(fs.readFileSync(keyMapPath, 'utf8'));

      const publicKey = keyMap[kid];
      if (!publicKey) throw new Error(`Unknown key ID: ${kid}`);

      // Verify the token.
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      socket.data.user = payload;

      next();
    } catch (err) {
      console.error('JWT error:', err);
      next(new Error('Invalid token'));
    }
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

    socket.on('joinChatRoom', ({ chatId }) => {
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
