export type ChannelPermissions = {
  adminsOnly?: boolean | undefined;
  readOnly?: boolean | undefined;
  allowedUsers?: string[] | undefined;
  allowedRoles?: string[] | undefined;
};

export type ChannelPermissionsString = {
  adminsOnly?: boolean;
  readOnly?: boolean;
  allowedUsers?: string;
  allowedRoles?: string;
};
