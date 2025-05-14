import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Express } from 'express';

import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import { updateChannel } from './controllers/chat.controller';
import { addChannelService } from './services/chat.service';
import { findUserById } from './services/user.service';
import { Channel } from './models/channel.model';
import { Chat } from './models/chat.model';
import { Member } from '../types/member.aliase';

// This function sets up the Socket.io server and handles events.
export function setupSocket(server: HttpServer, app: Express) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
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
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as jwt.JwtPayload;

      const userId = payload.sub || payload.id;
      if (!userId) throw new Error('Token missing subject/user ID');

      const user = await findUserById(userId);
      if (!user) throw new Error('User not found');

      socket.data.user = user;

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

      socket.emit('roomJoined', { chatId });
    });

    socket.on('joinChannel', ({ chatId, channelId }) => {
      const channelRoom = `${chatId}:${channelId}`;
      socket.join(channelRoom);
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

    socket.on('addChannel', async ({ chatId, channelName }) => {
      try {
        const userId = socket.data.user._id;

        const newChannel = await addChannelService(chatId, channelName, userId);

        io.to(chatId).emit('channelAdded', newChannel);
      } catch (err) {
        console.error('Channel addition failed:', err);
        socket.emit('error', (err as Error).message);
      }
    });

    socket.on('deleteChannel', async ({ channelId }, callback) => {
      try {
        const userId = socket.data.user._id;
        const channel = await Channel.findById(channelId);
        if (!channel) {
          return callback?.({ error: 'Channel not found' });
        }

        const chat = await Chat.findById(channel.chatId);
        const member = chat?.members.find((m: Member) => m.user.equals(userId));
        const isAdmin =
          member?.roles.includes('Admin') || member?.roles.includes('Owner');

        if (!isAdmin) {
          return callback?.({ error: 'Only admins can delete channels' });
        }

        await channel.deleteOne();

        io.to(chat._id.toString()).emit('channelDeleted', { channelId });
        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('editChannelTopic', async ({ channelId, topic }, callback) => {
      try {
        console.log('Editing channel topic:', channelId, topic);

        const userId = socket.data.user._id;

        const channel = await Channel.findById(channelId);
        if (!channel) {
          return callback?.({ error: 'Channel not found' });
        }

        const chat = await Chat.findById(channel.chatId);
        if (!chat) {
          return callback?.({ error: 'Chat not found' });
        }

        const member = chat.members.find((m: Member) => m.user.equals(userId));
        const isAdmin =
          member?.roles.includes('Admin') || member?.roles.includes('Owner');

        if (!isAdmin) {
          return callback?.({ error: 'Only admins can edit the topic' });
        }

        channel.topic = topic;
        await channel.save();

        io.to(chat._id.toString()).emit('channelEdited', { channel });
        callback?.({ success: true, channel });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('renameChannel', async ({ channelId, name }, callback) => {
      try {
        const userId = socket.data.user._id;

        const channel = await Channel.findById(channelId);
        if (!channel) {
          return callback?.({ error: 'Channel not found' });
        }

        const chat = await Chat.findById(channel.chatId);
        const member = chat?.members.find((m: Member) => m.user.equals(userId));
        const isAdmin =
          member?.roles.includes('Admin') || member?.roles.includes('Owner');

        if (!isAdmin) {
          return callback?.({ error: 'Only admins can rename channels' });
        }

        channel.name = name;
        await channel.save();

        io.to(chat._id.toString()).emit('channelEdited', { channel });
        callback?.({ success: true, channel });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on(
      'updateChannelPermissions',
      async ({ channelId, permissions }) => {
        const channel = await Channel.findByIdAndUpdate(
          channelId,
          { permissions },
          { new: true }
        );
        io.to(channel.chatId.toString()).emit('channelEdited', { channel });
      }
    );
  });

  return io;
}
