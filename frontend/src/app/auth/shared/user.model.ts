export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  pronouns?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
