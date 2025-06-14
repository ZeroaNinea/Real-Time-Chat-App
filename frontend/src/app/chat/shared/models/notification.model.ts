export interface Notification {
  sender?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  recipient: string;
  type: 'friend-request' | 'message' | 'mention' | 'status-change';
  message?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}
