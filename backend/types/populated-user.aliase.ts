import { Types } from 'mongoose';

export type PopulatedUser = {
  _id: Types.ObjectId;
  username: string;
  avatar: string;
  pronouns: string;
};
