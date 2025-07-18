export interface Message {
  _id: string;
  chatId: string;
  channelId: string;
  sender: string;
  text: string;
  isEdited: boolean;
  replyTo: string;
  reactions: {
    emoji: string;
    user: string[];
  };
  createdAt: string;
}
