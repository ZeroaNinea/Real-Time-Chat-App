import { Request, Response } from 'express';
import { Notification } from '../models/notification.model';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      recipient: userId,
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatar');

    return res.status(200).json(notifications);
  } catch (error) {
    // console.error(error);
    return res
      .status(500)
      .json({ error: 'Server error during notification fetch.' });
  }
};
