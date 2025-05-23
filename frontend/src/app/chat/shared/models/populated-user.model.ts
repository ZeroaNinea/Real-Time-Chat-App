export interface PopulatedUser {
  user: {
    _id: string;
    username: string;
    avatar: string;
    bio: string;
    pronouns: string;
    status: string;
  };
  roles: string[];
}
