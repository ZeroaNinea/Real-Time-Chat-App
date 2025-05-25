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

  return targetRank <= highestAssignerRank;
}
