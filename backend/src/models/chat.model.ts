import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface IChat {
  name: string;
  topic: string;
  preview: string;
  isPrivate: boolean;
  members: {
    user: mongoose.Schema.Types.ObjectId;
    roles: string[];
  }[];
  roles: {
    name: string;
    description?: string;
    permissions?: string[];
    allowedUserIds?: string[];
    allowedRoles?: string[];
    canBeSelfAssigned?: boolean;
  }[];
}

export interface ChatDocument extends IChat, Document {}

const ChatSchema = new mongoose.Schema<ChatDocument>(
  {
    name: { type: String, required: true },
    topic: { type: String, default: '' },
    preview: { type: String, default: '' },
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
        allowedUserIds: [String],
        allowedRoles: [String],
        canBeSelfAssigned: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const Chat = mongoose.model<ChatDocument>('Chat', ChatSchema);
