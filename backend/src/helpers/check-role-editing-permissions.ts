// interface AssignableRoles {
//   owner: string[];
//   admin: string[];
//   moderator: never[];
//   [key: string]: string[];
// }

// const assignableRoles: AssignableRoles = {
//   owner: ['Admin', 'Moderator'],
//   admin: ['Moderator'],
//   moderator: [],
// };

// export function canEditRole(
//   assignerRoles: string[] | never[],
//   targetRole: string
// ): boolean {
//   for (const role of assignerRoles) {
//     if (assignableRoles[role]?.includes(targetRole)) {
//       return true;
//     }
//   }
//   return false;
// }

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

  return targetRank < highestAssignerRank;
}
