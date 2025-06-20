export interface PrivateChatRoom {
  _id: string;
  name: string;
  isPrivate: true;
  updatedAt: Date;
  otherUser: {
    _id: string;
    username: string;
    avatar: string;
    status: string;
    pronouns: string;
  };
}
