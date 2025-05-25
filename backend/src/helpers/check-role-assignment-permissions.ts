interface AssignableRoles {
  owner: string[];
  admin: string[];
  moderator: never[];
  [key: string]: string[];
}

const assignableRoles: AssignableRoles = {
  owner: ['Admin', 'Moderator'],
  admin: ['Moderator'],
  moderator: [],
};

export function canAssignRole(
  assignerRoles: string[] | never[],
  targetRole: string
): boolean {
  for (const role of assignerRoles) {
    if (assignableRoles[role]?.includes(targetRole)) {
      return true;
    }
  }
  return false;
}
