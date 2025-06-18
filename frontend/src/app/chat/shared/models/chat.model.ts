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

export interface PrivateChat {
  _id: string;
  name: string;
  topic: string;
  thumbnail: string;
  isPrivate: boolean;
  members: {
    user: {
      _id: string;
      username: string;
      avatar: string;
      status: string;
      pronouns: string;
      bio: string;
      friends: string[];
      banlist: string[];
      pendingRequests: string[];
    };
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
