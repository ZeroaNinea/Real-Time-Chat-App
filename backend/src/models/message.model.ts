import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface IMessage {
  chatId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  isEdited: boolean;
  replyTo: mongoose.Types.ObjectId;
  reactions: [
    {
      emoji: string;
      users: mongoose.Types.ObjectId;
    }
  ];
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
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
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
