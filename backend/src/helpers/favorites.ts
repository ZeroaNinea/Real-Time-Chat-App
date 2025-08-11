import { User } from '../models/user.model';

async function findFavorites(userId: string) {
  return await User.findById(userId).populate('favoriteGifs');
}

export default { findFavorites };
