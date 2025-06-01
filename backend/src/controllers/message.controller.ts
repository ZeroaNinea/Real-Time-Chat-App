import { Request, Response } from 'express';
import { Message } from '../models/message.model';
import { Chat } from '../models/chat.model';
import { Member } from '../../types/member.alias';
import mongoose from 'mongoose';

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

// export const getMessages = async (req: Request, res: Response) => {
//   try {
//     const { chatId, channelId } = req.params;
//     const userId = req.user._id;

//     if (!chatId || !channelId) {
//       return res.status(400).json({ error: 'Missing chatId or channelId' });
//     }

//     const chat = await Chat.findById(chatId);
//     if (!chat || !chat.members.some((m: Member) => m.user.equals(userId))) {
//       return res.status(403).json({ error: 'Not authorized' });
//     }

//     const messages = await Message.find({ chatId, channelId }).sort({
//       createdAt: 1,
//     });

//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to get messages', error: err });
//   }
// };

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId, channelId } = req.params;
    const userId = req.user._id;
    const { limit = 20, before } = req.query;

    console.log('before', before);

    if (!chatId || !channelId) {
      return res.status(400).json({ error: 'Missing chatId or channelId' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.members.some((m: Member) => m.user.equals(userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // const query: any = { chatId, channelId };
    let chatObjectId: mongoose.Types.ObjectId;
    let channelObjectId: mongoose.Types.ObjectId;

    try {
      chatObjectId = new mongoose.Types.ObjectId(chatId);
      channelObjectId = new mongoose.Types.ObjectId(channelId);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid chatId or channelId' });
    }

    const query: any = {
      chatId: chatObjectId,
      channelId: channelObjectId,
    };

    if (before) {
      try {
        query._id = { $lt: new mongoose.Types.ObjectId(before as string) };
      } catch (e) {
        return res.status(400).json({ error: 'Invalid before ID' });
      }
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .lean();

    console.log('=== Returned messages ===');
    messages.forEach((msg: any) => {
      console.log(msg._id.toString(), msg.text);
    });

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Failed to get messages', error: err });
  }
};
