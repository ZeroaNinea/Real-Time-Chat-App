import { User } from '../models/user.model';

async function getUserWithFriends(userId: string) {
  return await User.findById(userId).populate(
    'friends',
    'username avatar bio pronouns status friends banlist pendingRequests'
  );
}

async function getUserWithBanlist(userId: string) {
  return await User.findById(userId).populate(
    'banlist',
    'username avatar bio pronouns status friends banlist pendingRequests'
  );
}

export default {
  getUserWithFriends,
  getUserWithBanlist,
};
