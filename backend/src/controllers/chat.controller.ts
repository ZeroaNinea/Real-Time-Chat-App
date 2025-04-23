import { Request, Response } from 'express';

import { Chat } from '../models/chat.model';

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
  const { name, channels } = req.body;

  const chat = await Chat.create({
    name,
    isPrivate: false,
    members: [req.user._id],
    admins: [req.user._id],
    channels: channels || [],
  });

  res.status(201).json(chat);
};
