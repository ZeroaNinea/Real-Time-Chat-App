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
import { Chat, ChatDocument } from './models/chat.model';
import { Member } from '../types/member.aliase';
import { Message } from './models/message.model';
import { User } from './models/user.model';
import { canAssignRole } from './helpers/check-role-assignment-permissions';

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

    socket.on('message', async ({ chatId, channelId, message: text }) => {
      try {
        const sender = socket.data.user._id;

        const chat = await Chat.findById(chatId);
        const isMember = chat?.members.some((m: Member) =>
          m.user.equals(sender)
        );
        if (!isMember) {
          return socket.emit('error', 'You are not a member of this chat.');
        }

        const message = await new Message({
          chatId,
          channelId,
          sender,
          text,
        }).save();

        io.to(chatId).emit('message', message);
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Message failed to send');
      }
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

        const chat = await Chat.findById(chatId);
        if (!chat) {
          throw new Error('Chat not found');
        }

        const member = chat.members.find((m: Member) => m.user.equals(userId));
        const isAdmin =
          member?.roles.includes('Admin') || member?.roles.includes('Owner');

        if (!isAdmin) {
          throw new Error('Only admins can add channels');
        }

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

        await Message.deleteMany({ channelId });
        await channel.deleteOne();

        io.to(chat._id.toString()).emit('channelMessagesDeleted', {
          channelId,
        });
        io.to(chat._id.toString()).emit('channelDeleted', { channelId });
        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('editChannelTopic', async ({ channelId, topic }, callback) => {
      try {
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
      async ({ channelId, permissions }, callback) => {
        try {
          const userId = socket.data.user._id;

          const channel = await Channel.findById(channelId);
          if (!channel) {
            return callback?.({ error: 'Channel not found' });
          }

          const chat = await Chat.findById(channel.chatId);
          if (!chat) {
            return callback?.({ error: 'Chat not found' });
          }

          const member = chat.members.find((m: Member) =>
            m.user.equals(userId)
          );
          const isAdmin =
            member?.roles.includes('Admin') || member?.roles.includes('Owner');

          if (!isAdmin) {
            return callback?.({ error: 'Only admins can edit permissions' });
          }

          // Merge with existing permissions (partial update).
          const updatedPermissions = {
            ...(channel.permissions || {}),
            ...permissions,
          };

          channel.permissions = updatedPermissions;
          await channel.save();

          io.to(chat._id.toString()).emit('channelEdited', { channel });
          callback?.({ success: true, channel });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );

    socket.on('deleteMessage', async ({ messageId }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ error: 'Message not found' });
        }

        const chat = await Chat.findById(message.chatId);
        if (!chat) {
          return callback?.({ error: 'Chat not found' });
        }

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        const isSender = message.sender.equals(socket.data.user._id);
        const isPrivileged =
          member?.roles.includes('Admin') ||
          member?.roles.includes('Owner') ||
          member?.roles.includes('Moderator');

        if (!isSender && !isPrivileged) {
          return callback?.({ error: 'Only admins can delete messages' });
        }

        await Message.findByIdAndDelete(messageId);

        io.to(chat._id.toString()).emit('messageDeleted', { messageId });
        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('editMessage', async ({ messageId, text }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ error: 'Message not found' });
        }

        const chat = await Chat.findById(message.chatId);
        if (!chat) {
          return callback?.({ error: 'Chat not found' });
        }

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        const isSender = message.sender.equals(socket.data.user._id);
        const isPrivileged =
          member?.roles.includes('Admin') ||
          member?.roles.includes('Owner') ||
          member?.roles.includes('Moderator');

        if (!isSender && !isPrivileged) {
          return callback?.({
            error: 'You are not allowed to edit this message',
          });
        }

        message.text = text;
        message.isEdited = true;
        await message.save();

        io.to(chat._id.toString()).emit('messageEdited', message);
        callback?.({ success: true, message });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('reply', async ({ messageId, text }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ error: 'Message not found' });
        }

        const chat = await Chat.findById(message.chatId);
        if (!chat) {
          return callback?.({ error: 'Chat not found' });
        }

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        if (!member) {
          return callback?.({ error: 'You are not a member of this chat' });
        }

        if (message.sender.equals(socket.data.user._id)) {
          return callback?.({
            error: 'You cannot reply to your own message',
          });
        }

        const reply = await Message.create({
          chatId: message.chatId,
          channelId: message.channelId,
          sender: socket.data.user._id,
          text,
          replyTo: message._id,
        });

        io.to(chat._id.toString()).emit('messageReplied', reply);
        callback?.({ success: true, message: reply });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('editStatus', async ({ status }, callback) => {
      try {
        const user = await User.findById(socket.data.user._id);
        if (!user) return callback?.({ error: 'User not found' });

        user.status = status;
        await user.save();

        const filteredUser = {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          pronouns: user.pronouns,
          status: user.status,
        };

        io.emit('userUpdated', filteredUser);
        callback?.({ success: true, user });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('assignRole', async ({ userId, role }, callback) => {
      try {
        const user = await User.findById(userId);
        if (!user) return callback?.({ error: 'User not found' });

        const chat = await Chat.findById(socket.data.chat._id);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        const isPrivileged =
          member?.roles.includes('Admin') ||
          member?.roles.includes('Owner') ||
          member?.roles.includes('Moderator');

        if (!isPrivileged) {
          return callback?.({ error: 'You are not allowed to assign roles' });
        }

        if (member?.roles.includes(role)) {
          return callback?.({ error: 'User already has this role' });
        }

        if (!canAssignRole(member?.roles, role)) {
          return callback?.({
            error: 'You are not allowed to assign this role',
          });
        }

        const updatedMember = chat.members.find((m: Member) =>
          m.user.equals(userId)
        );

        if (!updatedMember) {
          return callback?.({ error: 'Member not found' });
        }

        updatedMember.roles.push(role);
        await chat.save();

        io.to(chat._id.toString()).emit('memberUpdated', updatedMember);
        callback?.({ success: true, member: updatedMember });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('removeRole', async ({ userId, role }, callback) => {
      try {
        const user = await User.findById(userId);
        if (!user) return callback?.({ error: 'User not found' });

        const chat = await Chat.findById(socket.data.chat._id);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        const isPrivileged =
          member?.roles.includes('Admin') ||
          member?.roles.includes('Owner') ||
          member?.roles.includes('Moderator');

        if (!isPrivileged) {
          return callback?.({ error: 'You are not allowed to remove roles' });
        }

        const updatedMember = chat.members.find((m: Member) =>
          m.user.equals(userId)
        );

        if (!updatedMember) {
          return callback?.({ error: 'Member not found' });
        }

        // if (!canAssignRole(updatedMember.roles, role)) {
        //   return callback?.({
        //     error: 'You are not allowed to remove this role',
        //   });
        // }

        updatedMember.roles = updatedMember.roles.filter(
          (r: string) => r !== role
        );
        await chat.save();

        io.to(chat._id.toString()).emit('memberUpdated', updatedMember);
        callback?.({ success: true, member: updatedMember });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(
        `Socket ${socket.id} disconnected from chat ${socket.data.chat._id}`
      );
    });
  });

  return io;
}
