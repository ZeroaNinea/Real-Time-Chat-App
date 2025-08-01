import { Member } from '../../types/member.alias';
import { Role } from '../../types/role.alias';
import { Chat } from '../models/chat.model';

export async function checkPermission(chat: typeof Chat, member: Member) {
  const currentUserPermissions = member?.roles.map((role: string) => {
    const permissions =
      chat.roles.find((r: Role) => r.name === role)?.permissions || [];

    return [...new Set(permissions)];
  });

  return currentUserPermissions?.flat();
}
