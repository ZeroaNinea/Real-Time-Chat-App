import { User } from '../models/user.model';

async function findUserById(id: string) {
  return await User.findById(id).lean();
}

export default { findUserById };
