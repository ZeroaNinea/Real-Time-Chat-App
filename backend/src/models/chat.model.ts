import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface IChat {
  name: string;
  isPrivate: boolean;
  members: { type: mongoose.Schema.Types.ObjectId; ref: 'User' }[];
  admin: { type: mongoose.Schema.Types.ObjectId; ref: 'User' };
}

export interface ChatDocument extends IChat, Document {}

const ChatSchema = new mongoose.Schema<ChatDocument>(
  {
    name: {
      type: String,
    },
    isPrivate: {
      type: Boolean,
      required: true,
      default: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model<ChatDocument>('Chat', ChatSchema);
