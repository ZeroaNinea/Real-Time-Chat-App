import { Request, Response } from 'express';
import { User } from '../models/user.model';

export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      'friends',
      'username avatar bio pronouns status friends banlist pendingRequests'
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user.friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
