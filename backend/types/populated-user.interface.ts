import { Types } from 'mongoose';

export interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  avatar?: string;
  bio?: string;
  pronouns?: string;
  status?: string;
}
