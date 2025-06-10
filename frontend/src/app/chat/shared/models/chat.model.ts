export interface Chat {
  _id: string;
  name: string;
  topic: string;
  thumbnail: string;
  isPrivate: boolean;
  members: {
    user: string;
    roles: string[];
  }[];
  roles: {
    name: string;
    description?: string;
    permissions?: string[];
    allowedUserIds?: string[];
    allowedRoles?: string[];
    canBeSelfAssigned?: boolean;
  }[];
}
