import { Server, Socket } from 'socket.io';

import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { Channel, ChannelDocument } from '../models/channel.model';

import { Member } from '../../types/member.alias';
import { addChannelService } from '../services/chat.service';

export function registerChannelHandlers(io: Server, socket: Socket) {
  socket.on('addChannel', async ({ chatId, channelName }) => {
    try {
      const userId = socket.data.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const isMember = chat.members.some((m: Member) => m.user.equals(userId));

      if (!isMember) {
        throw new Error('You are not a member of this chat');
      }

      if (chat.isPrivate) {
        throw new Error('Private chat rooms cannot have channels');
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
    console.log('Editing channel topic...');
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

      io.to(chat._id.toString()).emit('channelEdited', channel);
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

      io.to(chat._id.toString()).emit('channelEdited', channel);
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

        const member = chat.members.find((m: Member) => m.user.equals(userId));
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

        io.to(chat._id.toString()).emit('channelEdited', channel);
        callback?.({ success: true, channel });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    }
  );

  socket.on('changeChannelOrder', async ({ channelIds, chatId }, callback) => {
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
  });
}
