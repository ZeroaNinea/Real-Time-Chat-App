import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface IChat {
  name: string;
  isPrivate: boolean;
  members: {
    user: mongoose.Schema.Types.ObjectId;
    roles: string[];
  }[];
  roles: {
    name: string;
    description?: string;
    permissions?: string[];
  }[];
}

export interface ChatDocument extends IChat, Document {}

const ChatSchema = new mongoose.Schema<ChatDocument>(
  {
    name: { type: String, required: true },
    isPrivate: { type: Boolean, default: true },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        roles: [{ type: String, required: true }],
      },
    ],

    roles: [
      {
        name: { type: String, required: true },
        description: { type: String },
        permissions: [String],
      },
    ],
  },
  { timestamps: true }
);

export const Chat = mongoose.model<ChatDocument>('Chat', ChatSchema);
