import { Server, Socket } from 'socket.io';

import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { Channel, ChannelDocument } from '../models/channel.model';

import { Member } from '../../types/member.alias';
import { addChannelService } from '../services/chat.service';
import { Role } from '../../types/role.alias';
import { checkPermission } from '../services/check-permission.service';

export function registerChannelHandlers(io: Server, socket: Socket) {
  socket.on('addChannel', async ({ chatId, channelName }) => {
    try {
      const userId = socket.data.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found.');
      }

      const member = chat.members.find((m: Member) => m.user.equals(userId));

      if (!member) {
        throw new Error('You are not a member of this chat.');
      }

      if (chat.isPrivate) {
        throw new Error('Private chat rooms cannot have channels.');
      }

      const currentUserPermissions = await checkPermission(chat, member);

      const isPrivilaged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        currentUserPermissions.includes('canCreateChannels');

      if (!isPrivilaged) {
        throw new Error('You are not allowed to add channels.');
      }

      const newChannel = await addChannelService(chatId, channelName, userId);

      io.to(chatId).emit('channelAdded', newChannel);
    } catch (err: any) {
      console.error('Channel addition failed:', err.message);
      socket.emit('error', err.message);
    }
  });

  socket.on('deleteChannel', async ({ channelId }, callback) => {
    try {
      const userId = socket.data.user._id;
      const channel = await Channel.findById(channelId);
      if (!channel) {
        callback?.({ error: 'Channel is not found.' });
      }

      const chat = await Chat.findById(channel.chatId);
      const member = chat?.members.find((m: Member) => m.user.equals(userId));

      if (!member) {
        callback?.({ error: 'You are not a member of this chat.' });
      }

      const isAdmin =
        member?.roles.includes('Admin') || member?.roles.includes('Owner');

      const currentUserPermissions = await checkPermission(chat, member);

      if (!isAdmin && !currentUserPermissions.includes('canDeleteChannels')) {
        callback?.({ error: 'You are not allowed to delete channels.' });
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
      callback?.({ error: 'Server error during channel deletion.' });
    }
  });

  socket.on('editChannelTopic', async ({ channelId, topic }, callback) => {
    try {
      const userId = socket.data.user._id;

      const channel = await Channel.findById(channelId);
      if (!channel) {
        callback?.({ error: 'Channel is not found.' });
      }

      const chat = await Chat.findById(channel.chatId);
      if (!chat) {
        callback?.({ error: 'Chat is not found.' });
      }

      const member = chat.members.find((m: Member) => m.user.equals(userId));

      if (!member) {
        callback?.({ error: 'You are not a member of this chat.' });
      }

      const isAdmin =
        member?.roles.includes('Admin') || member?.roles.includes('Owner');

      const currentUserPermissions = await checkPermission(chat, member);

      if (!isAdmin && !currentUserPermissions.includes('canEditChannels')) {
        callback?.({ error: 'You are not allowed to edit channels.' });
      }

      channel.topic = topic;
      await channel.save();

      io.to(chat._id.toString()).emit('channelEdited', channel);
      callback?.({ success: true, channel });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during channel topic update.' });
    }
  });

  socket.on('renameChannel', async ({ channelId, name }, callback) => {
    try {
      const userId = socket.data.user._id;

      const channel = await Channel.findById(channelId);
      if (!channel) {
        callback?.({ error: 'Channel is not found.' });
      }

      const chat = await Chat.findById(channel.chatId);
      if (!chat) {
        callback?.({ error: 'Chat is not found.' });
      }

      const member = chat?.members.find((m: Member) => m.user.equals(userId));
      if (!member) {
        callback?.({ error: 'You are not a member of this chat.' });
      }

      const isAdmin =
        member?.roles.includes('Admin') || member?.roles.includes('Owner');

      const currentUserPermissions = await checkPermission(chat, member);

      if (!isAdmin && !currentUserPermissions.includes('canEditChannels')) {
        callback?.({ error: 'You are not allowed to edit channels.' });
      }

      channel.name = name;
      await channel.save();

      io.to(chat._id.toString()).emit('channelEdited', channel);
      callback?.({ success: true, channel });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during channel editing.' });
    }
  });

  socket.on(
    'updateChannelPermissions',
    async ({ channelId, permissions }, callback) => {
      try {
        const userId = socket.data.user._id;

        const channel = await Channel.findById(channelId);
        if (!channel) {
          callback?.({ error: 'Channel is not found.' });
        }

        const chat = await Chat.findById(channel.chatId);
        if (!chat) {
          callback?.({ error: 'Chat is not found.' });
        }

        const member = chat.members.find((m: Member) => m.user.equals(userId));

        if (!member) {
          callback?.({ error: 'You are not a member of this chat.' });
        }

        const isAdmin =
          member?.roles.includes('Admin') || member?.roles.includes('Owner');

        const currentUserPermissions = await checkPermission(chat, member);

        if (
          !isAdmin &&
          !currentUserPermissions.includes('canEditChannels') &&
          !currentUserPermissions.includes('canDeleteChannels') &&
          !currentUserPermissions.includes('canCreateChannels')
        ) {
          callback?.({ error: 'You are not allowed to edit channels.' });
        }

        // Merge with existing permissions (partial update).
        const updatedPermissions = {
          ...(channel.permissions || {}),
          ...permissions,
        };

        channel.permissions = updatedPermissions;
        await channel.save();

        io.to(chat._id.toString()).emit('channelEdited', channel);
        callback?.({ success: true, channel });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error during channel editing.' });
      }
    }
  );

  socket.on('changeChannelOrder', async ({ channelIds, chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return callback?.({ error: 'Chat is not found.' });
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      if (!member)
        return callback?.({ error: 'You are not a member of this chat.' });

      const memberRoles = member.roles.map((role: string) => {
        return chat.roles.find((r: Role) => r.name === role);
      });

      const hasChannelEditPermissions = memberRoles.some(
        (role: Role): boolean => {
          if (role.permissions) {
            return (
              (role.permissions.includes('canEditChannels') &&
                role.permissions.includes('canCreateChannels')) ||
              role.name === 'Admin' ||
              role.name === 'Owner'
            );
          } else {
            return false;
          }
        }
      );

      if (!hasChannelEditPermissions) {
        return callback?.({
          error: 'You are not allowed to change the channel order.',
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
        callback?.({ error: 'Invalid channel order.' });
      }

      const bulkOps = channelIds.map((id: string, index: number) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: index } },
        },
      }));

      await Channel.bulkWrite(bulkOps);

      const updatedChannels = await Channel.find({ chatId }).sort('order');

      io.to(chatId).emit('channelsUpdated', updatedChannels);

      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during channel order change.' });
    }
  });
}
