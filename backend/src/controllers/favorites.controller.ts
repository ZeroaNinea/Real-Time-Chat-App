import { Request, Response } from 'express';
import { User } from '../models/user.model';

export const getFavorites = async (req: Request, res: Response) => {
  console.log('getFavorites');
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

export const addFavorite = async (req: Request, res: Response) => {
  console.log('add favorite called');
  console.log('addFavorite', req.body);
  try {
    const userId = req.user._id;
    const { gifUrl } = req.body;

    if (!gifUrl) return res.status(400).json({ error: 'GIF URL required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.favoriteGifs.includes(gifUrl)) {
      user.favoriteGifs.push(gifUrl);
      await user.save();
    }

    res.json(user.favoriteGifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  console.log('removeFavorite', req.body);
  try {
    const userId = req.user._id;
    const { gifUrl } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.favoriteGifs = user.favoriteGifs.filter(
      (url: string) => url !== gifUrl
    );
    await user.save();

    res.json(user.favoriteGifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
