// export type PopulatedUser = {
//   _id: string;
//   username: string;
//   avatar: string;
//   pronouns: string;
// };

export interface PopulatedUser {
  user: {
    _id: string;
    username: string;
    avatar: string;
    pronouns: string;
  };
  roles: string[];
}
