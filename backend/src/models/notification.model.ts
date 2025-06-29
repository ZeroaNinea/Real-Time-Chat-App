import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface INotification {
  sender: { type: mongoose.Schema.Types.ObjectId; ref: 'User' };
  recipient: {
    type: mongoose.Schema.Types.ObjectId;
    ref: 'User';
    required: true;
  };
  type:
    | 'friend-request'
    | 'friend-accepted'
    | 'friend-declined'
    | 'message'
    | 'mention'
    | 'status-change'
    | 'private-chat-deletion-request'
    | 'private-chat-deletion-confirmed'
    | 'private-chat-deletion-declined';
  message?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export interface NotificationDocument extends INotification, Document {}

const NotificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'friend-request',
        'friend-accepted',
        'friend-declined',
        'message',
        'mention',
        'status-change',
        'private-chat-deletion-request',
        'private-chat-deletion-confirmed',
        'private-chat-deletion-declined',
      ],
      required: true,
    },
    message: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<NotificationDocument>(
  'Notification',
  NotificationSchema
);
