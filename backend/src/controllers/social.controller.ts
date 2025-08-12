import { Request, Response } from 'express';

import { User } from '../models/user.model';
import socialHelpers from '../helpers/social-helpers';

export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const user = await socialHelpers.getUserWithFriends(userId);

    const filteredFriends = (user.friends as any[]).filter((friend) => {
      const friendBansUser = friend.banlist.includes(userId);
      const userBansFriend = user.banlist.includes(friend._id.toString());
      return !friendBansUser && !userBansFriend;
    });

    return res.status(200).json(filteredFriends);
  } catch (error) {
    // console.error(error);
    return res
      .status(500)
      .json({ message: 'Server error during friends fetch.' });
  }
};

export const getBanList = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const user = await socialHelpers.getUserWithBanlist(userId);

    return res.status(200).json(user.banlist);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server error during banlist fetch.' });
  }
};
