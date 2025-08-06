import { User } from '../models/user.model';

export async function findUserById(id: string) {
  return User.findById(id).lean();
}

export default {
  findUserById,
};
