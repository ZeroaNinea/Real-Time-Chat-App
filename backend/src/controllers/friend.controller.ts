import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getFriends = async (req: Request, res: Response) => {
  const userId = req.user._id;

  const friends = await req.user
    .populate('friends', 'username avatar')
    .execPopulate();

  res.json(friends.friends);
};
