import { Socket, Server } from 'socket.io';

import { User } from '../models/user.model';
import { Chat } from '../models/chat.model';

import { Member } from '../../types/member.alias';
import { ChatRoomRole } from '../../types/chat-room-role.alias';

import {
  canAssignPermissionsBelowOwnLevel,
  canEditRole,
} from '../helpers/check-role-editing-permissions';
import { checkPermission } from '../services/check-permission.service';

export function registerMemberHandlers(io: Server, socket: Socket) {
  socket.on('createRole', async ({ role, chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return callback?.({ error: 'Chat is not found.' });
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      const currentUserPermissions = await checkPermission(chat, member);

      if (
        role.name === 'Admin' ||
        role.name === 'Owner' ||
        role.name === 'Moderator'
      ) {
        return callback?.({
          error: 'You cannot create roles called Owner, Admin or Moderator.',
        });
      }

      const isPrivileged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        member?.roles.includes('Moderator') ||
        currentUserPermissions.includes('canAssignRoles');

      if (!isPrivileged) {
        return callback?.({ error: 'You are not allowed to create roles.' });
      }

      // if (!canEditRole(member?.roles || [], role)) {
      //   if (currentUserPermissions.length === 0) {
      //     return callback?.({
      //       error: 'You cannot create roles higher than your own.',
      //     });
      //   }
      // }

      const memberRoles = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      )?.roles;

      const memberPermissions: string[] = (memberRoles || []).flatMap(
        (role: string) => {
          return (
            chat.roles.find((r: ChatRoomRole) => r.name === role)
              ?.permissions || []
          );
        }
      );

      if (role.permissions) {
        if (
          !canAssignPermissionsBelowOwnLevel(
            memberPermissions,
            role.permissions
          )
        ) {
          return callback?.({
            error: 'You cannot create roles equal to or greater than your own.',
          });
        }
      }

      chat.roles.push(role);
      const updatedRole = chat.roles.find(
        (r: ChatRoomRole) => r.name === role.name
      );
      await chat.save();

      io.to(chat._id.toString()).emit('chatUpdated', chat);
      callback?.({ success: true, updatedRole: updatedRole });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during role creation.' });
    }
  });

  socket.on('deleteRole', async ({ role, chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return callback?.({ error: 'Chat not found' });

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      const currentUserPermissions = await checkPermission(chat, member);

      const isPrivileged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        member?.roles.includes('Moderator') ||
        currentUserPermissions.includes('canAssignRoles');

      if (!isPrivileged) {
        return callback?.({ error: 'You are not allowed to delete roles' });
      }

      if (!canEditRole(member?.roles || [], role)) {
        if (currentUserPermissions.length === 0) {
          return callback?.({
            error: 'You cannot delete roles higher than your own',
          });
        }
      }

      if (
        role.name === 'Owner' ||
        role.name === 'Admin' ||
        role.name === 'Moderator' ||
        role.name === 'Member' ||
        role.name === 'Muted' ||
        role.name === 'Banned'
      ) {
        return callback?.({
          error: 'You cannot delete default roles',
        });
      }

      const memberRoles = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      )?.roles;

      const memberPermissions: string[] = (memberRoles || []).flatMap(
        (role: string) => {
          return (
            chat.roles.find((r: ChatRoomRole) => r.name === role)
              ?.permissions || []
          );
        }
      );

      if (role.permissions) {
        if (
          !canAssignPermissionsBelowOwnLevel(
            memberPermissions,
            role.permissions
          )
        ) {
          return callback?.({
            error:
              'You cannot delete permissions equal to or greater than your own',
          });
        }
      }

      chat.roles = chat.roles.filter((r: ChatRoomRole) => r.name !== role.name);

      chat.members.forEach((m: Member) => {
        m.roles = m.roles.filter((r: string) => r !== role.name);
      });

      await chat.save();

      io.to(chat._id.toString()).emit('chatUpdated', chat);
      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });

  socket.on('editRole', async ({ role, chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return callback?.({ error: 'Chat is not found.' });
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      const currentUserPermissions = await checkPermission(chat, member);

      const isPrivileged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        member?.roles.includes('Moderator') ||
        currentUserPermissions.includes('canAssignRoles');

      if (!isPrivileged) {
        return callback?.({ error: 'You are not allowed to edit roles.' });
      }

      // if (!canEditRole(member?.roles || [], role)) {
      //   if (currentUserPermissions.length === 0) {
      //     return callback?.({
      //       error: 'You cannot edit roles higher than your own.',
      //     });
      //   }
      // }

      if (
        role.name === 'Owner' ||
        role.name === 'Admin' ||
        role.name === 'Moderator' ||
        role.name === 'Member' ||
        role.name === 'Muted' ||
        role.name === 'Banned'
      ) {
        return callback?.({
          error: 'You cannot edit default roles.',
        });
      }

      const memberRoles = member?.roles || [];

      const memberPermissions: string[] = (memberRoles || []).flatMap(
        (role: string) => {
          return (
            chat.roles.find((r: ChatRoomRole) => r.name === role)
              ?.permissions || []
          );
        }
      );

      if (role.permissions) {
        if (
          !canAssignPermissionsBelowOwnLevel(
            memberPermissions,
            role.permissions
          )
        ) {
          return callback?.({
            error:
              'You cannot edit permissions equal to or greater than your own.',
          });
        }
      }

      chat.roles = chat.roles.map((r: ChatRoomRole) => {
        if (r.name === role.name) {
          return role;
        }
        return r;
      });

      chat.members.forEach((m: Member) => {
        if (m.user.equals(socket.data.user._id)) {
          m.roles = m.roles.map((r: string) => {
            if (r === role.name) {
              return role.name;
            }
            return r;
          });
        }
      });

      await chat.save();

      io.to(chat._id.toString()).emit('chatUpdated', chat);
      callback?.({ success: true, updatedRole: role });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during role update.' });
    }
  });

  socket.on('assignRole', async ({ userId, chatId, role }, callback) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return callback?.({ error: 'User is not found.' });
      }

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return callback?.({ error: 'Chat is not found.' });
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      const currentUserPermissions = await checkPermission(chat, member);

      const isPrivileged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        member?.roles.includes('Moderator') ||
        currentUserPermissions.includes('canAssignRoles');

      if (!isPrivileged) {
        return callback?.({ error: 'You are not allowed to assign roles.' });
      }

      if (
        (member?.roles.includes('Owner') ||
          member?.roles.includes('Admin') ||
          member?.roles.includes('Moderator')) &&
        (role.name === 'Owner' ||
          role.name === 'Admin' ||
          role.name === 'Moderator')
      ) {
        if (!canEditRole(member?.roles || [], role.name)) {
          return callback?.({
            error: 'You cannot edit assign higher or equal to your own.',
          });
        }
      }

      if (
        role.name === 'Moderator' &&
        !currentUserPermissions.includes('canAssignModerators')
      ) {
        return callback?.({
          error: 'You are not allowed to assign moderators.',
        });
      }

      if (
        role.name === 'Admin' &&
        !currentUserPermissions.includes('canAssignAdmins.')
      ) {
        return callback?.({ error: 'You are not allowed to assign admins.' });
      }

      const updatedMember = chat.members.find((m: Member) =>
        m.user.equals(userId)
      );

      if (!updatedMember) {
        return callback?.({ error: 'Member is not found.' });
      }

      if (updatedMember?.roles.includes(role.name)) {
        return callback?.({ error: 'User already has this role.' });
      }

      updatedMember.roles.push(role.name);
      await chat.save();

      io.to(chat._id.toString()).emit('memberUpdated', updatedMember);
      callback?.({ success: true, member: updatedMember });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during role assignment.' });
    }
  });

  socket.on('toggleRole', async ({ roleName, selected, chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return callback?.({ error: 'Chat not found' });

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );
      if (!member)
        return callback?.({ error: 'You are not a member of this chat' });

      if (!member.user.equals(socket.data.user._id)) {
        return callback?.({
          error: "You cannot modify another user's roles",
        });
      }

      const role = chat.roles.find((r: ChatRoomRole) => r.name === roleName);
      if (!role) return callback?.({ error: 'Role not found' });

      const defaultRoles = [
        'Owner',
        'Admin',
        'Moderator',
        'Member',
        'Muted',
        'Banned',
      ];
      if (defaultRoles.includes(role.name)) {
        return callback?.({
          error: 'You cannot toggle default roles',
        });
      }

      const memberRoles = member.roles || [];

      const memberPermissions: string[] = memberRoles.flatMap(
        (role: string) =>
          chat.roles.find((r: ChatRoomRole) => r.name === role)?.permissions ||
          []
      );

      if (
        role.allowedUserIds?.length &&
        !role.allowedUserIds.includes(socket.data.user._id.toString())
      ) {
        return callback?.({
          error: 'You are not allowed to assign yourself this role',
        });
      }

      if (
        role.allowedRoles?.length &&
        !role.allowedRoles.some((r: string) => memberRoles.includes(r))
      ) {
        return callback?.({
          error: 'You do not meet the requirements to assign this role',
        });
      }

      if (!role.canBeSelfAssigned) {
        return callback?.({
          error: 'You cannot toggle this role',
        });
      }

      if (
        role.permissions &&
        !canAssignPermissionsBelowOwnLevel(memberPermissions, role.permissions)
      ) {
        return callback?.({
          error:
            'You cannot toggle permissions equal to or greater than your own',
        });
      }

      if (selected && !member.roles.includes(role.name)) {
        member.roles.push(role.name);
      } else {
        member.roles = member.roles.filter((r: string) => r !== role.name);
      }

      await chat.save();
      io.to(chat._id.toString()).emit('memberUpdated', member);
      callback?.({ success: true });
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

      const currentUserPermissions = await checkPermission(chat, actingMember);

      if (!actingMember || !targetMember) {
        return callback?.({ error: 'Member not found' });
      }

      const isPrivileged =
        actingMember.roles.includes('Admin') ||
        actingMember.roles.includes('Owner') ||
        actingMember.roles.includes('Moderator') ||
        currentUserPermissions.includes('canAssignRoles');

      if (!isPrivileged) {
        return callback?.({ error: 'You are not allowed to remove roles' });
      }

      if (!canEditRole(actingMember.roles, role)) {
        if (currentUserPermissions.length === 0) {
          return callback?.({
            error: 'You cannot remove roles higher than your own',
          });
        }
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

  socket.on('transferOwnership', async ({ userId, chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return callback?.({ error: 'Chat not found' });

      const requester = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      if (!requester || !requester.roles.includes('Owner')) {
        return callback?.({
          error: 'Only the current owner can transfer ownership',
        });
      }

      const newOwner = chat.members.find((m: Member) => m.user.equals(userId));

      if (!newOwner) {
        return callback?.({ error: 'User is not a member of this chat' });
      }

      if (newOwner.roles.includes('Owner')) {
        return callback?.({ error: 'User is already the owner' });
      }

      requester.roles = requester.roles.filter((r: string) => r !== 'Owner');
      if (!requester.roles.includes('Admin')) {
        requester.roles.push('Admin');
      }

      if (!newOwner.roles.includes('Owner')) {
        newOwner.roles.push('Owner');
      }

      await chat.save();

      io.to(chat._id.toString()).emit('memberUpdated', requester);
      io.to(chat._id.toString()).emit('memberUpdated', newOwner);

      callback?.({ success: true, member: newOwner });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });

  socket.on('becomeMember', async ({ chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return callback?.({ error: 'Chat not found' });

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      if (chat.isPrivate) {
        callback?.({ error: "You can't join a private chat" });
        return;
      }

      if (!member) {
        chat.members.push({
          user: socket.data.user._id,
          roles: ['Member'],
        });

        await chat.save();
        io.to(chat._id.toString()).emit('chatUpdated', chat);
        callback?.({ success: true });
      } else {
        callback?.({ error: 'You are already a member of this chat' });
      }
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });

  socket.on('leaveChatRoom', async ({ chatId }, callback) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return callback?.({ error: 'Chat not found' });

      if (chat.isPrivate) {
        callback?.({ error: "You can't leave a private chat" });
        return;
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      if (member?.roles.includes('Owner')) {
        callback?.({ error: 'You are the owner of this chat' });

        return;
      }

      if (!member) {
        callback?.({ error: 'You are not a member of this chat' });
      } else {
        chat.members = chat.members.filter(
          (m: Member) => !m.user.equals(socket.data.user._id)
        );
        await chat.save();
        io.to(socket.data.user._id.toString()).emit('chatLeft', chat);
        callback?.({ success: true });
      }
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
