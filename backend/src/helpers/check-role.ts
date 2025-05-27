// import mongoose from 'mongoose';
// import { ChatDocument } from '../models/chat.model';
// import { Member } from '../../types/member.alias';

// export function getMemberPermissionsFromChat(
//   chat: ChatDocument,
//   userId: mongoose.Types.ObjectId
// ): string[] {
//   const member = chat.members.find((m: Member) => m.user.equals(userId));
//   if (!member) return [];

//   return member.roles.flatMap((roleName) => {
//     return chat.roles.find((r) => r.name === roleName)?.permissions || [];
//   });
// }
