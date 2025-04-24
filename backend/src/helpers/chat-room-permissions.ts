import { ChatDocument } from '../models/chat.model';

function userHasPermission(
  chat: ChatDocument,
  userId: string,
  permissionName: string
) {
  const member = chat.members.find((m: any) => m.user.equals(userId));
  if (!member) return false;

  const userRoles = member.roles;
  return chat.roles.some(
    (role) =>
      userRoles.includes(role.name) &&
      role.permissions?.includes(permissionName)
  );
}
