const roleRanks: Record<string, number> = {
  Owner: 3,
  Admin: 2,
  Moderator: 1,
};

export function canEditRole(
  assignerRoles: string[],
  targetRole: string
): boolean {
  const targetRank = roleRanks[targetRole] ?? 0;
  const highestAssignerRank = Math.max(
    ...assignerRoles.map((r) => roleRanks[r] ?? 0)
  );

  if (
    targetRank <= highestAssignerRank &&
    (targetRole === 'Banned' || targetRole === 'Muted')
  ) {
    return false;
  }

  return targetRank <= highestAssignerRank;
}

export type Permission =
  | 'canBan'
  | 'canMute'
  | 'canDeleteMessages'
  | 'canCreateChannels'
  | 'canEditChannels'
  | 'canDeleteChannels'
  | 'canDeleteChatroom'
  | 'canAssignRoles'
  | 'canAssignAdmins'
  | 'canAssignModerators';

export function hasPermission(
  userPermissions: Permission[],
  required: Permission
): boolean {
  return userPermissions.includes(required);
}

export function hasAllPermissions(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.every((p) => userPermissions.includes(p));
}

export function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.some((p) => userPermissions.includes(p));
}

export function canAssignPermissions(
  assignerPermissions: Permission[],
  targetPermissions: Permission[]
): boolean {
  return hasAllPermissions(assignerPermissions, targetPermissions);
}
