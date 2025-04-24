import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface ChannelDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  name: string;
  topic?: string;
  permissions: {
    adminsOnly?: boolean;
    readOnly?: boolean;
    allowedUsers?: mongoose.Types.ObjectId[];
  };
}

const ChannelSchema = new mongoose.Schema<ChannelDocument>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    name: { type: String, required: true },
    topic: { type: String },
    permissions: {
      adminsOnly: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
      allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
  },
  { timestamps: true }
);

export const Channel = mongoose.model<ChannelDocument>(
  'Channel',
  ChannelSchema
);
