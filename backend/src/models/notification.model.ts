import mongoose from '../config/db';
import { Document } from 'mongoose';
import type { UserDocument } from './user.model';

export interface INotification {
  sender?: mongoose.Types.ObjectId | UserDocument | string;
  recipient: mongoose.Types.ObjectId | UserDocument | string;
  type: 'friend-request' | 'message' | 'mention' | 'status-change';
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
    type: { type: String, required: true },
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
