import { Request, Response } from 'express';
import { Message } from '../models/message.model';

export const sendMessage = async (req: Request, res: Response) => {
  const { chatId, text } = req.body;

  const message = await Message.create({
    sender: req.user!._id,
    chat: chatId,
    text,
  });

  res.status(201).json(message);
};

export const getMessages = async (req: Request, res: Response) => {
  const { chatId } = req.params;

  const messages = await Message.find({ chat: chatId }).populate(
    'sender',
    'username avatar'
  );
  res.json(messages);
};
