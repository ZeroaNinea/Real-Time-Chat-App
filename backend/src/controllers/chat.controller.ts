import { Request, Response } from 'express';

import { Chat } from '../models/chat.model';

export const mine = async (req: Request, res: Response) => {
  const chats = await Chat.find({
    members: req.user._id,
  });

  res.json(chats);
};

export const privateMessages = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const chat = await Chat.create({
    isPrivate: true,
    members: [req.user._id, userId],
  });
  res.json(chat);
};
