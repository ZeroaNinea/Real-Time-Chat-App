import { Types } from 'mongoose';

export interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  avatar: string;
  pronouns: string;
}
