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
  try {
    const { name, channels } = req.body;

    const chat = await Chat.create({
      name,
      isPrivate: false,
      owner: req.user._id,
      admins: [req.user._id],
      members: [
        {
          user: req.user._id,
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

    if (!chat.owner.equals(req.user._id)) {
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
