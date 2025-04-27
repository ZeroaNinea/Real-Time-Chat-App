export interface Chat {
  _id: string;
  name: string;
  isPrivate: boolean;
  members: {
    user: string;
    roles: string[];
  }[];
  roles: {
    name: string;
    description?: string;
    permissions?: string[];
  }[];
}
