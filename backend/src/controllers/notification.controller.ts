import { Request, Response } from 'express';
import { Notification } from '../models/notification.model';
import mongoose from 'mongoose';

export const getNotifications = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const notifications = await Notification.find({
    sender: userId,
    recipient: userId,
  }).sort({ createdAt: -1 });

  res.json(notifications);
};
