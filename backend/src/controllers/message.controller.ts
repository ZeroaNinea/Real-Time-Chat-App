import { Request, Response } from 'express';
import { Message } from '../models/message.model';
import { Chat } from '../models/chat.model';
import { Member } from '../../types/member.alias';
import mongoose from 'mongoose';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId, channelId } = req.params;
    const userId = req.user._id;
    const { limit = 20, before } = req.query;

    if (!chatId || !channelId) {
      return res.status(400).json({ error: 'Missing chatId or channelId' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.members.some((m: Member) => m.user.equals(userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const query: any = { chatId, channelId };

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

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Failed to get messages', error: err });
  }
};

export const getReplyMessages = async (req: Request, res: Response) => {
  try {
    const { chatId, channelId } = req.params;
    const { replyToIds } = req.body;
    const userId = req.user._id;

    if (!chatId || !channelId) {
      return res.status(400).json({ error: 'Missing chatId or channelId' });
    }

    if (
      !Array.isArray(replyToIds) ||
      !replyToIds.every((id) => typeof id === 'string')
    ) {
      return res.status(400).json({ error: 'Invalid replyToIds' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.members.some((m: Member) => m.user.equals(userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await Message.find({
      chatId,
      channelId,
      _id: { $in: replyToIds },
    }).select('_id text sender createdAt');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get messages', error: err });
  }
};
