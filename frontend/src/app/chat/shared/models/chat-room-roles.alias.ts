export type ChatRoomRole = {
  name: string;
  description: string;
  permissions: string[];
  allowedUserIds: string[];
  allowedRoles: string[];
  canBeSelfAssigned: boolean;
};
