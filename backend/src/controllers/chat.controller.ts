import { Request, Response } from 'express';

import { Chat } from '../models/chat.model';
import { Channel, ChannelDocument } from '../models/channel.model';
import { Member } from '../../types/member.aliase';
import { addChannelService } from '../services/chat.service';

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

    // console.log(req.body, '============');

    const chat = await Chat.create({
      name,
      isPrivate: false,
      roles: [
        { name: 'Owner', description: 'Full permissions' },
        { name: 'Admin', description: 'Manage channels and users' },
        { name: 'Member', description: 'Basic access' },
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

    if (!chat) {
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

    // await channels.forEach(async (channel: ChannelDocument) => {
    //   await channel.deleteOne();
    // });
    await Promise.all(
      channels.map((channel: ChannelDocument) => channel.deleteOne())
    );
    await chat.deleteOne();

    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete chat', error: err });
  }
};

export const getChat = async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('members');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get chat', error: err });
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

export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const chat = await Chat.findById(channel.chatId);
    const member = chat?.members.find((m: Member) =>
      m.user.equals(req.user._id)
    );
    const isAdmin =
      member?.roles.includes('Admin') || member?.roles.includes('Owner');

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: 'Only admins can delete channels' });
    }

    await channel.deleteOne();
    res.status(200).json({ message: 'Channel deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete channel', error: err });
  }
};
