import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface IMessage {
  chatId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  isEdited: boolean;
  replyTo: mongoose.Types.ObjectId;
  timestamp?: Date;
}

export interface MessageDocument extends IMessage, Document {}

const MessageSchema = new mongoose.Schema<MessageDocument>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: false,
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
    isEdited: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
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
