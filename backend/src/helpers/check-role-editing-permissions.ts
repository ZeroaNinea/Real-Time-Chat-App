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

const PERMISSION_RANKS: Record<string, number> = {
  canBan: 1,
  canMute: 1,
  canDeleteMessages: 1,
  canCreateChannels: 2,
  canEditChannels: 2,
  canDeleteChannels: 3,
  canAssignRoles: 4,
  canAssignModerators: 5,
  canAssignAdmins: 6,
  canDeleteChatroom: 7,
};

export function getMaxPermissionRank(permissions: string[]): number {
  return Math.max(...permissions.map((p) => PERMISSION_RANKS[p] || 0));
}

export function canAssignPermissionsBelowOwnLevel(
  assignerPermissions: string[],
  targetPermissions: string[]
): boolean {
  const assignerMax = getMaxPermissionRank(assignerPermissions);
  const targetMax = getMaxPermissionRank(targetPermissions);

  return targetMax <= assignerMax;
}
