import { Request, Response } from 'express';

import { Chat } from '../models/chat.model';
import { UserDocument } from '../models/user.model';
import { Channel } from '../models/channel.model';

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

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const member = chat.members.find((m: any) => m.user.equals(req.user._id));
    const isOwner = member?.roles.includes('Owner');

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: 'Only the owner can delete this chat' });
    }

    await chat.deleteOne();

    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete chat', error: err });
  }
};

export const addChannel = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { channelName } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const member = chat.members.find((m: any) => m.user.equals(req.user._id));
    const isAdminOrOwner = member?.roles.some((r: any) =>
      ['Owner', 'Admin'].includes(r)
    );

    if (!isAdminOrOwner) {
      return res
        .status(403)
        .json({ message: 'Only admins or owner can add channels' });
    }

    const channel = await Channel.create({
      chatId: chat._id,
      name: channelName,
    });

    res.status(201).json({ message: 'Channel created successfully', channel });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create channel', error: err });
  }
};
