import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Express } from 'express';

import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import { addChannelService } from './services/chat.service';
import { findUserById } from './services/user.service';
import { Channel, ChannelDocument } from './models/channel.model';
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

    // socket.on('editChannel', ({ chatId, channel }) => {
    //   updateChannel(chatId, channel)
    //     .then(() => {
    //       io.to(chatId).emit('channelEdited', { channel });
    //     })
    //     .catch((err: unknown) => {
    //       console.error('Channel update failed:', err);
    //     });
    // });

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

    socket.on('assignRole', async ({ userId, chatId, role }, callback) => {
      try {
        const user = await User.findById(userId);
        if (!user) return callback?.({ error: 'User not found' });

        const chat = await Chat.findById(chatId);
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

        if (!canEditRole(member?.roles || [], role)) {
          return callback?.({
            error: 'You cannot edit roles higher than your own',
          });
        }

        const updatedMember = chat.members.find((m: Member) =>
          m.user.equals(userId)
        );

        if (!updatedMember) {
          return callback?.({ error: 'Member not found' });
        }

        if (updatedMember?.roles.includes(role.name)) {
          return callback?.({ error: 'User already has this role' });
        }

        updatedMember.roles.push(role.name);
        await chat.save();

        io.to(chat._id.toString()).emit('memberUpdated', updatedMember);
        callback?.({ success: true, member: updatedMember });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('removeRole', async ({ userId, chatId, role }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const actingMember = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );
        const targetMember = chat.members.find((m: Member) =>
          m.user.equals(userId)
        );

        if (!actingMember || !targetMember) {
          return callback?.({ error: 'Member not found' });
        }

        const isPrivileged =
          actingMember.roles.includes('Admin') ||
          actingMember.roles.includes('Owner') ||
          actingMember.roles.includes('Moderator');

        if (!isPrivileged) {
          return callback?.({ error: 'You are not allowed to remove roles' });
        }

        // if (actingMember.user.equals(userId)) {
        //   return callback?.({ error: 'You cannot remove your own role' });
        // }

        if (!canEditRole(actingMember.roles, role)) {
          return callback?.({
            error: 'You cannot remove roles higher than your own',
          });
        }

        if (!targetMember.roles.includes(role)) {
          return callback?.({ error: 'User does not have this role' });
        }

        targetMember.roles = targetMember.roles.filter(
          (r: string) => r !== role
        );
        await chat.save();

        io.to(chat._id.toString()).emit('memberUpdated', targetMember);
        callback?.({ success: true, member: targetMember });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('transferOwnership', async ({ userId, chatId }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const requester = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        if (!requester || !requester.roles.includes('Owner')) {
          return callback?.({
            error: 'Only the current owner can transfer ownership',
          });
        }

        const newOwner = chat.members.find((m: Member) =>
          m.user.equals(userId)
        );

        if (!newOwner) {
          return callback?.({ error: 'User is not a member of this chat' });
        }

        if (newOwner.roles.includes('Owner')) {
          return callback?.({ error: 'User is already the owner' });
        }

        requester.roles = requester.roles.filter((r: string) => r !== 'Owner');
        if (!requester.roles.includes('Admin')) {
          requester.roles.push('Admin');
        }

        if (!newOwner.roles.includes('Owner')) {
          newOwner.roles.push('Owner');
        }

        await chat.save();

        io.to(chat._id.toString()).emit('memberUpdated', requester);
        io.to(chat._id.toString()).emit('memberUpdated', newOwner);

        callback?.({ success: true, member: newOwner });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('createRole', async ({ role, chatId }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        if (
          role.name === 'Admin' ||
          role.name === 'Owner' ||
          role.name === 'Moderator'
        ) {
          return callback?.({
            error: 'You cannot create roles called Owner, Admin or Moderator',
          });
        }

        const isPrivileged =
          member?.roles.includes('Admin') ||
          member?.roles.includes('Owner') ||
          member?.roles.includes('Moderator');

        if (!isPrivileged) {
          return callback?.({ error: 'You are not allowed to create roles' });
        }

        if (!canEditRole(member?.roles || [], role)) {
          return callback?.({
            error: 'You cannot create roles higher than your own',
          });
        }

        const memberRoles = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        )?.roles;

        const memberPermissions: string[] = (memberRoles || []).flatMap(
          (role: string) => {
            return (
              chat.roles.find((r: ChatRoomRole) => r.name === role)
                ?.permissions || []
            );
          }
        );

        if (role.permissions) {
          if (
            !canAssignPermissionsBelowOwnLevel(
              memberPermissions,
              role.permissions
            )
          ) {
            return callback?.({
              error:
                'You cannot assign permissions equal to or greater than your own',
            });
          }
        }

        chat.roles.push(role);
        const updatedRole = chat.roles.find(
          (r: ChatRoomRole) => r.name === role.name
        );
        await chat.save();

        io.to(chat._id.toString()).emit('chatUpdated', chat);
        callback?.({ success: true, updatedRole: updatedRole });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('deleteRole', async ({ role, chatId }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        const isPrivileged =
          member?.roles.includes('Admin') ||
          member?.roles.includes('Owner') ||
          member?.roles.includes('Moderator');

        if (!isPrivileged) {
          return callback?.({ error: 'You are not allowed to delete roles' });
        }

        if (!canEditRole(member?.roles || [], role)) {
          return callback?.({
            error: 'You cannot delete roles higher than your own',
          });
        }

        if (
          role.name === 'Owner' ||
          role.name === 'Admin' ||
          role.name === 'Moderator' ||
          role.name === 'Member' ||
          role.name === 'Muted' ||
          role.name === 'Banned'
        ) {
          return callback?.({
            error: 'You cannot delete default roles',
          });
        }

        const memberRoles = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        )?.roles;

        const memberPermissions: string[] = (memberRoles || []).flatMap(
          (role: string) => {
            return (
              chat.roles.find((r: ChatRoomRole) => r.name === role)
                ?.permissions || []
            );
          }
        );

        if (role.permissions) {
          if (
            !canAssignPermissionsBelowOwnLevel(
              memberPermissions,
              role.permissions
            )
          ) {
            return callback?.({
              error:
                'You cannot delete permissions equal to or greater than your own',
            });
          }
        }

        chat.roles = chat.roles.filter(
          (r: ChatRoomRole) => r.name !== role.name
        );

        chat.members.forEach((m: Member) => {
          m.roles = m.roles.filter((r: string) => r !== role.name);
        });

        await chat.save();

        io.to(chat._id.toString()).emit('chatUpdated', chat);
        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('editRole', async ({ role, chatId }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        const isPrivileged =
          member?.roles.includes('Admin') ||
          member?.roles.includes('Owner') ||
          member?.roles.includes('Moderator');

        if (!isPrivileged) {
          return callback?.({ error: 'You are not allowed to edit roles' });
        }

        if (!canEditRole(member?.roles || [], role)) {
          return callback?.({
            error: 'You cannot edit roles higher than your own',
          });
        }

        if (
          role.name === 'Owner' ||
          role.name === 'Admin' ||
          role.name === 'Moderator' ||
          role.name === 'Member' ||
          role.name === 'Muted' ||
          role.name === 'Banned'
        ) {
          return callback?.({
            error: 'You cannot edit default roles',
          });
        }

        const memberRoles = member?.roles || [];

        const memberPermissions: string[] = (memberRoles || []).flatMap(
          (role: string) => {
            return (
              chat.roles.find((r: ChatRoomRole) => r.name === role)
                ?.permissions || []
            );
          }
        );

        if (role.permissions) {
          if (
            !canAssignPermissionsBelowOwnLevel(
              memberPermissions,
              role.permissions
            )
          ) {
            return callback?.({
              error:
                'You cannot edit permissions equal to or greater than your own',
            });
          }
        }

        chat.roles = chat.roles.map((r: ChatRoomRole) => {
          if (r.name === role.name) {
            return role;
          }
          return r;
        });

        chat.members.forEach((m: Member) => {
          if (m.user.equals(socket.data.user._id)) {
            m.roles = m.roles.map((r: string) => {
              if (r === role.name) {
                return role.name;
              }
              return r;
            });
          }
        });

        await chat.save();

        io.to(chat._id.toString()).emit('chatUpdated', chat);
        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on(
      'toggleRole',
      async ({ roleName, selected, chatId }, callback) => {
        try {
          const chat = await Chat.findById(chatId);
          if (!chat) return callback?.({ error: 'Chat not found' });

          const member = chat.members.find((m: Member) =>
            m.user.equals(socket.data.user._id)
          );
          if (!member)
            return callback?.({ error: 'You are not a member of this chat' });

          if (!member.user.equals(socket.data.user._id)) {
            return callback?.({
              error: "You cannot modify another user's roles",
            });
          }

          const role = chat.roles.find(
            (r: ChatRoomRole) => r.name === roleName
          );
          if (!role) return callback?.({ error: 'Role not found' });

          const defaultRoles = [
            'Owner',
            'Admin',
            'Moderator',
            'Member',
            'Muted',
            'Banned',
          ];
          if (defaultRoles.includes(role.name)) {
            return callback?.({
              error: 'You cannot toggle default roles',
            });
          }

          const memberRoles = member.roles || [];

          const memberPermissions: string[] = memberRoles.flatMap(
            (role: string) =>
              chat.roles.find((r: ChatRoomRole) => r.name === role)
                ?.permissions || []
          );

          if (
            role.allowedUserIds?.length &&
            !role.allowedUserIds.includes(socket.data.user._id.toString())
          ) {
            return callback?.({
              error: 'You are not allowed to assign yourself this role',
            });
          }

          if (
            role.allowedRoles?.length &&
            !role.allowedRoles.some((r: string) => memberRoles.includes(r))
          ) {
            return callback?.({
              error: 'You do not meet the requirements to assign this role',
            });
          }

          if (!role.canBeSelfAssigned) {
            return callback?.({
              error: 'You cannot toggle this role',
            });
          }

          if (
            role.permissions &&
            !canAssignPermissionsBelowOwnLevel(
              memberPermissions,
              role.permissions
            )
          ) {
            return callback?.({
              error:
                'You cannot toggle permissions equal to or greater than your own',
            });
          }

          if (selected && !member.roles.includes(role.name)) {
            member.roles.push(role.name);
          } else {
            member.roles = member.roles.filter((r: string) => r !== role.name);
          }

          await chat.save();
          io.to(chat._id.toString()).emit('memberUpdated', member);
          callback?.({ success: true });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );

    socket.on(
      'changeChannelOrder',
      async ({ channelIds, chatId }, callback) => {
        try {
          const chat = await Chat.findById(chatId);
          if (!chat) return callback?.({ error: 'Chat not found' });

          const member = chat.members.find((m: Member) =>
            m.user.equals(socket.data.user._id)
          );
          if (!member)
            return callback?.({ error: 'You are not a member of this chat' });

          const isAdminOrOwner =
            member.roles.includes('Admin') || member.roles.includes('Owner');

          const hasChannelEditPermissions =
            member.permissions.includes('canEditChannels') &&
            member.permissions.includes('canDeleteChannels');

          if (!isAdminOrOwner && !hasChannelEditPermissions) {
            return callback?.({
              error: 'You are not authorized to change the channel order',
            });
          }

          const existingChannels = await Channel.find({ chatId });

          const existingIds = existingChannels.map((c: ChannelDocument) =>
            c._id?.toString()
          );
          const uniqueIds = new Set(channelIds);

          const isValid =
            channelIds.length === existingChannels.length &&
            [...uniqueIds].every((id) => existingIds.includes(id));

          if (!isValid) {
            return callback?.({ error: 'Invalid channel order' });
          }

          const bulkOps = channelIds.map((id: string, index: number) => ({
            updateOne: {
              filter: { _id: id },
              update: { $set: { order: index } },
            },
          }));

          await Channel.bulkWrite(bulkOps);

          console.log(JSON.stringify(bulkOps));

          const updatedChannels = await Channel.find({ chatId }).sort('order');

          console.log('updatedChannels', updatedChannels);
          io.to(chatId).emit('channelsUpdated', updatedChannels);

          callback?.({ success: true });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );

    socket.on('becomeMember', async ({ chatId }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        if (!member) {
          chat.members.push({
            user: socket.data.user._id,
            roles: ['Member'],
          });

          await chat.save();
          io.to(chat._id.toString()).emit('chatUpdated', chat);
          callback?.({ success: true });
        } else {
          callback?.({ error: 'You are already a member of this chat' });
        }
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('leaveChatRoom', async ({ chatId }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: 'Chat not found' });

        const member = chat.members.find((m: Member) =>
          m.user.equals(socket.data.user._id)
        );

        if (member?.roles.includes('Owner')) {
          callback?.({ error: 'You are the owner of this chat' });

          return;
        }

        if (!member) {
          callback?.({ error: 'You are not a member of this chat' });
        } else {
          chat.members = chat.members.filter(
            (m: Member) => !m.user.equals(socket.data.user._id)
          );
          await chat.save();
          io.to(socket.data.user._id.toString()).emit('chatLeft', chat);
          callback?.({ success: true });
        }
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('sendFriendRequest', async ({ receiverId }, callback) => {
      try {
        const senderId = socket.data.user._id.toString();
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver)
          return callback?.({ error: 'User not found' });

        if (receiver.friends?.includes(senderId))
          return callback?.({ error: 'Already friends' });

        if (sender.pendingRequests?.includes(receiverId))
          return callback?.({ error: 'Friend request already sent' });

        if (senderId === receiverId)
          return callback?.({
            error: 'Cannot send friend request to yourself',
          });

        if (receiver.banlist?.includes(senderId))
          return callback?.({ error: 'User is banned' });

        if (sender.banlist?.includes(receiverId))
          return callback?.({ error: 'You are banned by the user' });

        sender.pendingRequests?.push(receiverId);
        await sender.save();

        const notification = new Notification({
          sender: senderId,
          recipient: receiverId,
          type: 'friend-request',
          message: `${sender.username} sent you a friend request`,
          link: '/friends',
        });

        await notification.save();

        const targetSocketId = receiver._id.toString();

        if (targetSocketId) {
          const populatedNotification = await notification.populate(
            'sender',
            'username avatar'
          );
          io.to(targetSocketId).emit('notification', populatedNotification);
        }

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on(
      'acceptFriendRequest',
      async ({ notificationId, senderId }, callback) => {
        try {
          const receiverId = socket.data.user._id.toString();
          const sender = await User.findById(senderId);
          const receiver = await User.findById(receiverId);

          if (!sender || !receiver)
            return callback?.({ error: 'User not found' });

          if (
            !sender.pendingRequests?.some(
              (id: ObjectId) => id.toString() === receiverId
            )
          )
            return callback?.({ error: 'Friend request not found' });

          if (senderId === receiverId)
            return callback?.({
              error: 'Cannot accept friend request from yourself',
            });

          if (receiver.banlist?.includes(senderId))
            return callback?.({ error: 'User is banned' });

          if (sender.banlist?.includes(receiverId))
            return callback?.({ error: 'You are banned by the user' });

          sender.friends?.push(receiverId);
          receiver.friends?.push(senderId);

          sender.pendingRequests = sender.pendingRequests.filter(
            (id: string) => id.toString() !== receiverId
          );

          await sender.save();
          await receiver.save();

          await Notification.findByIdAndDelete(notificationId);

          const acceptNotification = await new Notification({
            sender: receiverId,
            recipient: senderId,
            type: 'friend-accepted',
            message: `${receiver.username} accepted your friend request`,
            link: '/friends',
          }).save();

          const populatedAccept = await acceptNotification.populate(
            'sender',
            'username avatar'
          );
          io.to(senderId).emit('notification', populatedAccept);
          io.to(socket.data.user._id.toString()).emit('notificationDeleted', {
            notificationId,
          });

          const populatedSender = await sender.populate(
            'friends',
            'username avatar bio pronouns status friends banlist pendingRequests'
          );
          const populatedReceiver = await receiver.populate(
            'friends',
            'username avatar bio pronouns status friends banlist pendingRequests'
          );

          io.to(socket.data.user._id.toString()).emit(
            'friendAdded',
            populatedSender
          );
          io.to(senderId).emit('friendAddedByOther', populatedReceiver);

          callback?.({ success: true });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );

    socket.on(
      'declineFriendRequest',
      async ({ notificationId, senderId }, callback) => {
        try {
          const receiverId = socket.data.user._id.toString();
          const sender = await User.findById(senderId);
          const receiver = await User.findById(receiverId);

          if (!sender || !receiver)
            return callback?.({ error: 'User not found' });

          if (
            !sender.pendingRequests?.some(
              (id: ObjectId) => id.toString() === receiverId
            )
          )
            return callback?.({ error: 'Friend request not found' });

          await Notification.findByIdAndDelete(notificationId);

          sender.pendingRequests = sender.pendingRequests.filter(
            (id: string) => id.toString() !== receiverId
          );
          await sender.save();

          const declineNotification = await new Notification({
            sender: receiverId,
            recipient: senderId,
            type: 'friend-declined',
            message: `${receiver.username} declined your friend request`,
            link: '/friends',
          }).save();

          const populatedDecline = await declineNotification.populate(
            'sender',
            'username avatar'
          );

          io.to(senderId).emit('notification', populatedDecline);
          io.to(socket.data.user._id.toString()).emit('notificationDeleted', {
            notificationId,
          });
          callback?.({ success: true });
        } catch (err) {
          console.error(err);
          callback?.({ error: 'Server error' });
        }
      }
    );

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

    socket.on('removeFriend', async (friendId, callback) => {
      console.log('remove friend', friendId);
      try {
        const currentUserId = socket.data.user._id.toString();

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
          return callback?.({ error: 'Invalid friend ID' });
        }

        const [userExists, friendExists] = await Promise.all([
          User.exists({ _id: currentUserId }),
          User.exists({ _id: friendId }),
        ]);
        if (!userExists || !friendExists) {
          return callback?.({ error: 'User not found' });
        }

        await Promise.all([
          User.updateOne(
            { _id: currentUserId },
            { $pull: { friends: friendId } }
          ),
          User.updateOne(
            { _id: friendId },
            { $pull: { friends: currentUserId } }
          ),
        ]);

        io.to(currentUserId).emit('friendRemoved', { friendId });
        io.to(friendId).emit('friendRemovedByOther', { userId: currentUserId });

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('banUser', async (userId, callback) => {
      try {
        const currentUserId = socket.data.user._id.toString();

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return callback?.({ error: 'Invalid user ID' });
        }

        if (userId === currentUserId) {
          return callback?.({ error: 'Cannot ban yourself' });
        }

        const [user, currentUser] = await Promise.all([
          User.findById(userId),
          User.findById(currentUserId),
        ]);

        if (!user || !currentUser) {
          return callback?.({ error: 'User not found' });
        }

        if (currentUser.banlist.includes(user._id)) {
          return callback?.({ error: 'User already banned' });
        }

        await User.updateOne(
          { _id: currentUserId },
          {
            $addToSet: { banlist: user._id },
            $pull: { friends: user._id },
          }
        );
        await User.updateOne(
          { _id: user._id },
          {
            $pull: { friends: currentUser._id },
          }
        );

        const populatedUser = await user.populate(
          'banlist',
          'username avatar bio pronouns status friends banlist pendingRequests'
        );
        const populatedCurrentUser = await currentUser.populate(
          'banlist',
          'username avatar bio pronouns status friends banlist pendingRequests'
        );

        io.to(currentUserId).emit('userBanned', populatedUser);
        io.to(userId).emit('userBannedByOther', populatedCurrentUser);

        io.to(currentUserId).emit('friendRemoved', { friendId: userId });
        io.to(userId).emit('friendRemovedByOther', { userId: currentUserId });

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });

    socket.on('unbanUser', async (userId, callback) => {
      try {
        const currentUserId = socket.data.user._id.toString();

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return callback?.({ error: 'Invalid user ID' });
        }

        if (userId === currentUserId) {
          return callback?.({ error: 'Cannot unban yourself' });
        }

        const [user, currentUser] = await Promise.all([
          User.findById(userId),
          User.findById(currentUserId),
        ]);

        if (!user || !currentUser) {
          return callback?.({ error: 'User not found' });
        }

        if (!currentUser.banlist.includes(user._id)) {
          return callback?.({ error: 'User not banned' });
        }

        await User.updateOne(
          { _id: currentUserId },
          { $pull: { banlist: user._id } }
        );

        io.to(currentUserId).emit('userUnbanned', { userId: user._id });
        io.to(userId).emit('userUnbannedByOther', { userId: currentUser._id });

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    });
  });

  return io;
}
