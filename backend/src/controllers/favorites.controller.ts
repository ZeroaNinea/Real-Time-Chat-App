import { Request, Response } from 'express';
import { User } from '../models/user.model';

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('favoriteGifs');

    if (!user) return res.status(404).json({ error: 'User not found' });

    const favoriteGifs = user.favoriteGifs;

    res.json(favoriteGifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
