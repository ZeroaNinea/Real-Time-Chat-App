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

    const filteredFriends = (user.friends as any[]).filter((friend) => {
      const friendBansUser = friend.banlist.includes(userId);
      const userBansFriend = user.banlist.includes(friend._id.toString());
      return !friendBansUser && !userBansFriend;
    });

    res.json(filteredFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBanList = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      'banlist',
      'username avatar bio pronouns status friends banlist pendingRequests'
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user.banlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
