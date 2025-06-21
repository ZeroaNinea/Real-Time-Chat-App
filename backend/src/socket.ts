import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Express } from 'express';

import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import { findUserById } from './services/user.service';
import { Chat } from './models/chat.model';
import { Member } from '../types/member.alias';
import { Message } from './models/message.model';
import { User } from './models/user.model';
import { Notification } from './models/notification.model';
import {
  canAssignPermissionsBelowOwnLevel,
  canEditRole,
} from './helpers/check-role-editing-permissions';
import { ChatRoomRole } from '../types/chat-room-role.alias';

import mongoose from './config/db';
import { ObjectId } from 'mongoose';

import { registerSocketHandlers } from './sockets';

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
    registerSocketHandlers(io, socket);

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

    socket.on('deleteNotification', async (notificationId, callback) => {
      try {
        const currentNotification = await Notification.findById(notificationId);

        if (
          socket.data.user._id.toString() !==
          currentNotification.recipient.toString()
        )
          return callback?.({ error: 'Unauthorized' });

        await Notification.findByIdAndDelete(notificationId);

        io.to(socket.data.user._id.toString()).emit('notificationDeleted', {
          notificationId,
        });
        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on(
      'deletePrivateChatRequest',
      async ({ receiverId, chatId }, callback) => {
        try {
          const senderId = socket.data.user._id.toString();
          const sender = await User.findById(senderId);
          const receiver = await User.findById(receiverId);
          const chat = await Chat.findById(chatId);

          if (!sender || !receiver || !chat) {
            return callback?.({ error: 'Invalid data provided' });
          }

          if (sender.deletionRequests.includes(receiverId)) {
            return callback?.({ error: 'Deletion request already sent' });
          }

          sender.deletionRequests.push(receiverId);
          await sender.save();

          if (
            !chat.isPrivate ||
            !chat.members.some((m: Member) => m.user.equals(senderId))
          ) {
            return callback?.({
              error: 'You are not authorized to delete this chat',
            });
          }

          const existing = await Notification.findOne({
            sender: senderId,
            recipient: receiverId,
            type: 'private-chat-deletion-request',
            link: chatId,
          });

          if (existing) {
            return callback?.({ error: 'Deletion request already sent' });
          }

          const notification = new Notification({
            sender: senderId,
            recipient: receiverId,
            type: 'private-chat-deletion-request',
            message: `${sender.username} wants to delete your private chat.`,
            link: chatId,
          });

          await notification.save();

          const populatedNotification = await notification.populate(
            'sender',
            'username avatar'
          );
          io.to(receiverId.toString()).emit(
            'notification',
            populatedNotification
          );

          callback?.({ success: true });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );

    socket.on(
      'confirmDeletePrivateChat',
      async ({ chatId, recipientId }, callback) => {
        try {
          const confirmerId = socket.data.user._id.toString();
          const chat = await Chat.findById(chatId);

          if (!chat || !chat.isPrivate) {
            return callback?.({ error: 'Chat not found or not private' });
          }

          const isMember = chat.members.some((m: Member) =>
            m.user.equals(confirmerId)
          );
          if (!isMember) {
            return callback?.({ error: 'You are not a member of this chat' });
          }

          const recipient = await User.findById(recipientId);
          if (!recipient) {
            return callback?.({ error: 'Recipient not found' });
          }

          if (!recipient.deletionRequests.includes(confirmerId)) {
            return callback?.({ error: 'Deletion request not found' });
          }

          recipient.deletionRequests = recipient.deletionRequests.filter(
            (id: string) => id === confirmerId
          );
          await recipient.save();

          await Message.deleteMany({ chatId });
          await chat.deleteOne();

          const deletionRequest = await Notification.findOne({
            sender: recipientId,
            recipient: confirmerId,
            type: 'private-chat-deletion-request',
            link: chatId,
          });

          await Notification.deleteOne({
            _id: deletionRequest._id,
          });

          const notification = new Notification({
            sender: confirmerId,
            recipient: recipientId,
            type: 'private-chat-deletion-confirmed',
            message: `Private chat was deleted by ${socket.data.user.username}`,
          });

          await notification.save();
          const populated = await notification.populate(
            'sender',
            'username avatar'
          );

          io.to(recipientId).emit('notification', populated);
          io.to(confirmerId).emit('notificationDeleted', {
            notificationId: deletionRequest._id,
          });

          callback?.({ success: true });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );

    socket.on(
      'declinePrivateChatDeletion',
      async ({ chatId, recipientId }, callback) => {
        try {
          const declinerId = socket.data.user._id.toString();

          const notification = await Notification.findOneAndDelete({
            sender: recipientId,
            recipient: declinerId,
            type: 'private-chat-deletion-request',
            link: chatId,
          });

          if (!notification) {
            return callback?.({ error: 'Deletion request not found' });
          }

          const declineNotification = new Notification({
            sender: declinerId,
            recipient: recipientId,
            type: 'private-chat-deletion-declined',
            message: `Private chat deletion request was declined by ${socket.data.user.username}`,
          });

          const recipient = await User.findById(recipientId);

          if (!recipient) {
            return callback?.({ error: 'Recipient not found' });
          }

          if (!recipient.deletionRequests.includes(declinerId)) {
            return callback?.({ error: 'Deletion request not found' });
          }

          recipient.deletionRequests = recipient.deletionRequests.filter(
            (id: string) => id === declinerId
          );
          await recipient.save();

          await declineNotification.save();

          const populated = await declineNotification.populate(
            'sender',
            'username avatar'
          );

          io.to(recipientId).emit('notification', populated);
          io.to(declinerId).emit('notificationDeleted', {
            notificationId: notification._id,
          });

          callback?.({ success: true });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );
  });

  return io;
}
