import { Request, Response } from 'express';
import { Notification } from '../models/notification.model';
import mongoose from 'mongoose';

export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user._id;

  const notifications = await Notification.find({
    recipient: userId,
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'username avatar');

  console.log(notifications);

  res.json(notifications);
};
