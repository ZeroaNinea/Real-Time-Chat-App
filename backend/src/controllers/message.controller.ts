import { Request, Response } from 'express';
import { Message } from '../models/message.model';
import { Chat } from '../models/chat.model';
import { Member } from '../../types/member.aliase';

// export const sendMessage = async (req: Request, res: Response) => {
//   const { chatId, text } = req.body;

//   const message = await Message.create({
//     sender: req.user!._id,
//     chat: chatId,
//     text,
//   });

//   res.status(201).json(message);
// };

// export const getMessages = async (req: Request, res: Response) => {
//   const { chatId } = req.params;

//   const messages = await Message.find({ chat: chatId }).populate(
//     'sender',
//     'username avatar'
//   );
//   res.json(messages);
// };

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId, channelId } = req.params;
    const userId = req.user._id;

    if (!chatId || !channelId) {
      return res.status(400).json({ error: 'Missing chatId or channelId' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.members.some((m: Member) => m.user.equals(userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await Message.find({ chatId, channelId }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get messages', error: err });
  }
};
