export interface Chat {
  _id: string;
  name: string;
  isPrivate: boolean;
  members: string[];
  admins: string[];
}
