import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface IMessage {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  timestamp?: Date;
}

export interface MessageDocument extends IMessage, Document {}

const MessageSchema = new mongoose.Schema<MessageDocument>(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model<MessageDocument>(
  'Message',
  MessageSchema
);
