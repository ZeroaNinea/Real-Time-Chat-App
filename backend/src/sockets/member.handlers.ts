import { Socket, Server } from 'socket.io';

import { User } from '../models/user.model';
import { Chat } from '../models/chat.model';

import { Member } from '../../types/member.alias';
import { canEditRole } from '../helpers/check-role-editing-permissions';

export function registerMemberHandlers(io: Server, socket: Socket) {
  socket.on('assignRole', async ({ userId, chatId, role }, callback) => {
    try {
      const user = await User.findById(userId);
      if (!user) return callback?.({ error: 'User not found' });

      const chat = await Chat.findById(chatId);
      if (!chat) return callback?.({ error: 'Chat not found' });

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      const isPrivileged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        member?.roles.includes('Moderator');

      if (!isPrivileged) {
        return callback?.({ error: 'You are not allowed to assign roles' });
      }

      if (!canEditRole(member?.roles || [], role)) {
        return callback?.({
          error: 'You cannot edit roles higher than your own',
        });
      }

      const updatedMember = chat.members.find((m: Member) =>
        m.user.equals(userId)
      );

      if (!updatedMember) {
        return callback?.({ error: 'Member not found' });
      }

      if (updatedMember?.roles.includes(role.name)) {
        return callback?.({ error: 'User already has this role' });
      }

      updatedMember.roles.push(role.name);
      await chat.save();

      io.to(chat._id.toString()).emit('memberUpdated', updatedMember);
      callback?.({ success: true, member: updatedMember });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });

  socket.on('removeRole', async ({ userId, chatId, role }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return callback?.({ error: 'Chat not found' });

      const actingMember = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );
      const targetMember = chat.members.find((m: Member) =>
        m.user.equals(userId)
      );

      if (!actingMember || !targetMember) {
        return callback?.({ error: 'Member not found' });
      }

      const isPrivileged =
        actingMember.roles.includes('Admin') ||
        actingMember.roles.includes('Owner') ||
        actingMember.roles.includes('Moderator');

      if (!isPrivileged) {
        return callback?.({ error: 'You are not allowed to remove roles' });
      }

      // if (actingMember.user.equals(userId)) {
      //   return callback?.({ error: 'You cannot remove your own role' });
      // }

      if (!canEditRole(actingMember.roles, role)) {
        return callback?.({
          error: 'You cannot remove roles higher than your own',
        });
      }

      if (!targetMember.roles.includes(role)) {
        return callback?.({ error: 'User does not have this role' });
      }

      targetMember.roles = targetMember.roles.filter((r: string) => r !== role);
      await chat.save();

      io.to(chat._id.toString()).emit('memberUpdated', targetMember);
      callback?.({ success: true, member: targetMember });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
