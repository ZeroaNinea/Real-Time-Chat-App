import { UserDocument } from '../models/user.model';

export const buildAccountResponse = (user: UserDocument) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    pronouns: user.pronouns,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
