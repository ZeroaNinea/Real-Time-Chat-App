import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface ChannelDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  order: { type: Number; default: 0 };
  name: string;
  topic?: string;
  permissions: {
    adminsOnly?: boolean;
    readOnly?: boolean;
    allowedUsers?: mongoose.Types.ObjectId[];
    allowedRoles?: string[];
  };
}

const ChannelSchema = new mongoose.Schema<ChannelDocument>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    order: { type: Number, default: 0 },
    name: { type: String, required: true },
    topic: { type: String },
    permissions: {
      adminsOnly: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
      allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      allowedRoles: [String],
    },
  },
  { timestamps: true }
);

export const Channel = mongoose.model<ChannelDocument>(
  'Channel',
  ChannelSchema
);
