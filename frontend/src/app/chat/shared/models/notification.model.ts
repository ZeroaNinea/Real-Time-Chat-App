export interface Notification {
  sender?: string;
  recipient: string;
  type: 'friend-request' | 'message' | 'mention' | 'status-change';
  message?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}
