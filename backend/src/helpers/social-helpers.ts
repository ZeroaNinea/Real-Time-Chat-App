import { User } from '../models/user.model';

export default {
  async getUserWithFriends(userId: string) {
    return User.findById(userId).populate(
      'friends',
      'username avatar bio pronouns status friends banlist pendingRequests'
    );
  },

  async getUserWithBanlist(userId: string) {
    return User.findById(userId).populate(
      'banlist',
      'username avatar bio pronouns status friends banlist pendingRequests'
    );
  },
};
