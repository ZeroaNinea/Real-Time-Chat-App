export interface PopulatedUser {
  user: {
    _id: string;
    username: string;
    avatar: string;
    bio: string;
    pronouns: string;
    status: string;
    friends: string[];
    banlist: string[];
    pendingRequests: string[];
  };
  roles: string[];
}

export type AbbreviatedPopulatedUser = {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
  pronouns: string;
  status: string;
  friends: string[];
  banlist: string[];
  pendingRequests: string[];
};
