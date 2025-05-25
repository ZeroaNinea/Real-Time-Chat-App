import { Request, Response } from 'express';

import { Chat } from '../models/chat.model';
import { Channel, ChannelDocument } from '../models/channel.model';
import { Member } from '../../types/member.aliase';
import { addChannelService } from '../services/chat.service';
import { Message, MessageDocument } from '../models/message.model';
import { User } from '../models/user.model';
import { PopulatedUser } from '../../types/populated-user.interface';

export const mine = async (req: Request, res: Response) => {
  const chats = await Chat.find({
    members: req.user._id,
  }).populate('members', 'username avatar');

  res.json(chats);
};

export const privateMessages = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const existingChat = await Chat.findOne({
    isPrivate: true,
    members: { $all: [req.user._id, userId], $size: 2 },
  });

  if (existingChat) {
    res.status(403).json(existingChat);

    return;
  }

  const chat = await Chat.create({
    isPrivate: true,
    members: [req.user._id, userId],
  });
  res.json(chat);
};

export const createChat = async (req: Request, res: Response) => {
  try {
    const { name, channels } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Chat name is required' });
    }

    const chat = await Chat.create({
      name,
      isPrivate: false,
      roles: [
        {
          name: 'Owner',
          description: 'Full permissions',
          permissions: ['manageEverything'],
          canBeSelfAssigned: false,
        },
        {
          name: 'Admin',
          description: 'Manage channels and users',
          permissions: ['manageChannels', 'manageUsers'],
          canBeSelfAssigned: false,
        },
        {
          name: 'Moderator',
          description: 'Moderate users and messages',
          permissions: ['moderateMessages', 'banUsers'],
          canBeSelfAssigned: false,
        },
        {
          name: 'Member',
          description: 'Basic access',
          permissions: ['sendMessage'],
          canBeSelfAssigned: false,
        },
        {
          name: 'Muted',
          description: 'User cannot send messages',
          permissions: [],
          canBeSelfAssigned: false,
        },
        {
          name: 'Banned',
          description: 'User is banned from the chat',
          permissions: [],
          canBeSelfAssigned: false,
        },
      ],
      members: [
        {
          user: req.user._id,
          roles: ['Owner'],
        },
      ],
    });

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create chat', error: err });
  }
};

export const updateChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const updates = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Example: ensure user is owner/admin (pseudo-code).
    const userId = req.user?.id; // assuming auth middleware sets req.user.
    const member = chat.members.find(
      (m: Member) => m.user.toString() === userId
    );

    if (
      !member ||
      (!member.roles.includes('Owner') && !member.roles.includes('Admin'))
    ) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to update this chat room' });
    }

    // Apply updates.
    Object.assign(chat, updates);

    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    const channels = await Channel.find({ chatId: req.params.chatId });
    const messages = await Message.find({ chatId: req.params.chatId });

    if (!chat || !channels) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const member = chat.members.find((m: Member) =>
      m.user.equals(req.user._id)
    );
    const isOwner = member?.roles.includes('Owner');

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: 'Only the owner can delete this chat' });
    }

    await Promise.all(
      channels.map((channel: ChannelDocument) => channel.deleteOne())
    );

    await Promise.all(
      messages.map((message: MessageDocument) => message.deleteOne())
    );

    await chat.deleteOne();

    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete chat', error: err });
  }
};

export const getChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId).populate('members');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const member = chat.members.find((m: Member) => m.user.equals(userId));
    if (!member)
      return res
        .status(403)
        .json({ message: 'You are not a member of this chat' });

    const chatRoles = chat.roles;

    const userRoles = member.roles;

    const channels = await Channel.find({ chatId });

    const accessibleChannels = channels.filter((channel: ChannelDocument) => {
      const { adminsOnly, allowedUsers, allowedRoles } =
        channel.permissions || {};

      const isUserAllowed = allowedUsers?.some((u) => u.equals(userId));
      const hasAllowedRole = allowedRoles?.some((r) => userRoles.includes(r));
      const isAdmin = userRoles.includes('Admin');
      const isOwner = userRoles.includes('Owner');

      if (isOwner) return true;
      if (adminsOnly && !isAdmin) return false;
      if (allowedUsers?.length && !isUserAllowed) return false;
      if (allowedRoles?.length && !hasAllowedRole) return false;

      return true;
    });

    res.json({ ...chat.toObject(), channels: accessibleChannels, chatRoles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get chat', error: err });
  }
};

export const getChatMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const member = chat.members.find((m: Member) => m.user.equals(userId));
    if (!member)
      return res
        .status(403)
        .json({ message: 'You are not a member of this chat' });

    // Get all user IDs from the members array.
    const userIds = chat.members.map((m: Member) => m.user);

    // Fetch all users from the User collection.
    const users = await User.find({ _id: { $in: userIds } }).select(
      '_id username avatar bio pronouns status'
    );

    // Merge roles with user data.
    const members = chat.members.map((member: Member) => {
      const user = users.find((u: PopulatedUser) => u._id.equals(member.user));
      return {
        user,
        roles: member.roles,
      };
    });

    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get chat members', error: err });
  }
};

// Channels

export const addChannel = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { channelName } = req.body;
    const userId = req.user._id;

    const channel = await addChannelService(chatId, channelName, userId);
    const io = req.app.get('io');
    io.to(chatId).emit('channelAdded', { channel });

    res.status(201).json({ message: 'Channel created successfully', channel });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const channel = await Channel.findByIdAndUpdate(id, updates, { new: true });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Get chat to check if user is authorized (optional, already done in deleteChannel).
    const chat = await Chat.findById(channel.chatId);
    const member = chat?.members.find((m: Member) =>
      m.user.equals(req.user._id)
    );
    const isAdmin =
      member?.roles.includes('Admin') || member?.roles.includes('Owner');

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: 'Only admins can update channels' });
    }

    // 🔌 Emit event.
    req.app.get('io')?.to(channel.chatId.toString()).emit('channelUpdated', {
      channelId: id,
      updates,
    });

    res.json(channel);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update channel', error: err });
  }
};
