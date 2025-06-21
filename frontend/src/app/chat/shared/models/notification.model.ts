// export interface Notification {
//   sender?: string;
//   recipient: string;
//   type: 'friend-request' | 'message' | 'mention' | 'status-change';
//   message?: string;
//   link?: string;
//   read: boolean;
//   createdAt: Date;
// }

export interface PopulatedNotification {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  recipient: string;
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
