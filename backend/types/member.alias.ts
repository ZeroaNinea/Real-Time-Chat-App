import { Types } from 'mongoose';

export type Member = {
  user: Types.ObjectId;
  roles: string[];
};
