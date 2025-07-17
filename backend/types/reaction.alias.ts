import { Types } from 'mongoose';

export type Reaction = {
  emoji: string;
  user: Types.ObjectId;
};
