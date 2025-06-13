import mongoose from '../config/db';
import { Document } from 'mongoose';

export interface INotification {
  recipient: string;
  type: 'friend-request' | 'message' | 'mention' | 'status-change';
  message?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

export interface NotificationDocument extends INotification, Document {}

const NotificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    recipient: { type: String, required: true },
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
