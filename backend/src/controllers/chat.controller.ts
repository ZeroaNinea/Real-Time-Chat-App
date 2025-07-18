import { Request, Response } from 'express';

import path from 'path';
import fs from 'fs';

import { Chat, ChatDocument } from '../models/chat.model';
import { Channel, ChannelDocument } from '../models/channel.model';
import { Member } from '../../types/member.alias';
import { addChannelService } from '../services/chat.service';
import { Message, MessageDocument } from '../models/message.model';
import { User } from '../models/user.model';
import { PopulatedUser } from '../../types/populated-user.interface';

export const deleteThumbnailFile = (chat: typeof Chat.prototype) => {
  if (!chat.thumbnail) return;

  const fullPath = path.join(
    __dirname,
    '../../uploads/chat-thumbnails',
    chat.thumbnail
  );
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

export const mine = async (req: Request, res: Response) => {
  const chats = await Chat.find({
    members: req.user._id,
  }).populate('members', 'username avatar');

  res.json(chats);
};

export const privateMessages = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const existingChat = await Chat.findOne({
    isPrivate: true,
    members: { $all: [req.user._id, userId], $size: 2 },
  });

  if (existingChat) {
    res.status(403).json(existingChat);

    return;
  }

  const chat = await Chat.create({
    isPrivate: true,
    members: [req.user._id, userId],
  });
  res.json(chat);
};

export const createChat = async (req: Request, res: Response) => {
  try {
    const { name, topic } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Chat name is required' });
    }

    const thumbnail = req.file?.filename;
    const chat = await Chat.create({
      name,
      isPrivate: false,
      topic: topic,
      thumbnail: thumbnail,
      roles: [
        {
          name: 'Owner',
          description: 'Full permissions',
          permissions: [
            'canBan',
            'canMute',
            'canDeleteMessages',
            'canCreateChannels',
            'canEditChannels',
            'canDeleteChannels',
            'canDeleteChatroom',
            'canAssignRoles',
            'canAssignAdmins',
            'canAssignModerators',
          ],
          canBeSelfAssigned: false,
        },
        {
          name: 'Admin',
          description: 'Manage channels and users',
          permissions: [
            'canBan',
            'canMute',
            'canDeleteMessages',
            'canCreateChannels',
            'canEditChannels',
            'canDeleteChannels',
            'canAssignRoles',
            'canAssignModerators',
          ],
          canBeSelfAssigned: false,
        },
        {
          name: 'Moderator',
          description: 'Moderate users and messages',
          permissions: [
            'canBan',
            'canMute',
            'canDeleteMessages',
            'canAssignRoles',
          ],
          canBeSelfAssigned: false,
        },
        {
          name: 'Member',
          description: 'Basic access',
          permissions: [],
          canBeSelfAssigned: false,
        },
        {
          name: 'Muted',
          description: 'User cannot send messages',
          permissions: [],
          canBeSelfAssigned: false,
        },
        {
          name: 'Banned',
          description: 'User is banned from the chat',
          permissions: [],
          canBeSelfAssigned: false,
        },
      ],
      members: [
        {
          user: req.user._id,
          roles: ['Owner', 'Member'],
        },
      ],
    });

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create chat', error: err });
  }
};

export const updateChat = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const updates = req.body;

  console.log('Updates:', updates);

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Example: ensure user is owner/admin (pseudo-code).
    const userId = req.user?.id; // assuming auth middleware sets req.user.
    const member = chat.members.find(
      (m: Member) => m.user.toString() === userId
    );

    if (req.file) {
      if (chat.thumbnail) {
        deleteThumbnailFile(chat);
      }

      chat.thumbnail = req.file.filename;
    }

    if (
      !member ||
      (!member.roles.includes('Owner') && !member.roles.includes('Admin'))
    ) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to update this chat room' });
    }

    // Apply updates.
    Object.assign(chat, updates);

    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    const channels = await Channel.find({ chatId: req.params.chatId });
    const messages = await Message.find({ chatId: req.params.chatId });

    if (!chat || !channels) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const member = chat.members.find((m: Member) =>
      m.user.equals(req.user._id)
    );
    const isOwner = member?.roles.includes('Owner');

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: 'Only the owner can delete this chat' });
    }

    await Promise.all(
      channels.map((channel: ChannelDocument) => channel.deleteOne())
    );

    await Promise.all(
      messages.map((message: MessageDocument) => message.deleteOne())
    );

    await chat.deleteOne();

    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete chat', error: err });
  }
};

export const removeThumbnail = async (req: Request, res: Response) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const member = chat.members.find((m: Member) =>
      m.user.equals(req.user._id)
    );
    const isOwner =
      member?.roles.includes('Owner') || member?.roles.includes('Admin');

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: 'Only the owner or admin can remove the thumbnail' });
    }

    deleteThumbnailFile(chat);
    chat.thumbnail = null;

    await chat.save();
    res.status(200).json({ message: 'Thumbnail removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove thumbnail', error: err });
  }
};

export const getChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.chatId;

    if (!chatId || chatId === 'null') {
      throw new Error('Invalid chat ID');
    }

    const chat = await Chat.findById(chatId).populate('members');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const member = chat.members.find((m: Member) => m.user.equals(userId));
    if (!member)
      return res
        .status(403)
        .json({ message: 'You are not a member of this chat' });

    const chatRoles = chat.roles;

    const userRoles = member.roles;

    const channels = await Channel.find({ chatId });

    const isPrivate = chat.isPrivate;

    const accessibleChannels = channels.filter((channel: ChannelDocument) => {
      const { adminsOnly, allowedUsers, allowedRoles } =
        channel.permissions || {};

      const isUserAllowed = allowedUsers?.some((u) => u.equals(userId));
      const hasAllowedRole = allowedRoles?.some((r) => userRoles.includes(r));
      const isAdmin = userRoles.includes('Admin');
      const isOwner = userRoles.includes('Owner');

      if (isOwner) return true;
      if (adminsOnly && !isAdmin) return false;
      if (allowedUsers?.length && !isUserAllowed) return false;
      if (allowedRoles?.length && !hasAllowedRole) return false;

      return true;
    });

    res.json({
      ...chat.toObject(),
      channels: accessibleChannels,
      chatRoles,
      isPrivate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get chat', error: err });
  }
};

export const getChatMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const member = chat.members.find((m: Member) => m.user.equals(userId));
    if (!member)
      return res
        .status(403)
        .json({ message: 'You are not a member of this chat' });

    // Get all user IDs from the members array.
    const userIds = chat.members.map((m: Member) => m.user);

    // Fetch all users from the User collection.
    const users = await User.find({ _id: { $in: userIds } }).select(
      '_id username avatar bio pronouns status friends banlist pendingRequests deletionRequests roles'
    );

    // Merge roles with user data.
    const members = chat.members.map((member: Member) => {
      const user = users.find((u: PopulatedUser) => u._id.equals(member.user));
      return {
        user,
        roles: member.roles,
      };
    });

    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get chat members', error: err });
  }
};

// Channels

export const addChannel = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { channelName } = req.body;
    const userId = req.user._id;

    const channel = await addChannelService(chatId, channelName, userId);
    const io = req.app.get('io');
    io.to(chatId).emit('channelAdded', { channel });

    res.status(201).json({ message: 'Channel created successfully', channel });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const channel = await Channel.findByIdAndUpdate(id, updates, { new: true });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Get chat to check if user is authorized (optional, already done in deleteChannel).
    const chat = await Chat.findById(channel.chatId);
    const member = chat?.members.find((m: Member) =>
      m.user.equals(req.user._id)
    );
    const isAdmin =
      member?.roles.includes('Admin') || member?.roles.includes('Owner');

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: 'Only admins can update channels' });
    }

    // 🔌 Emit event.
    req.app.get('io')?.to(channel.chatId.toString()).emit('channelUpdated', {
      channelId: id,
      updates,
    });

    res.json(channel);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update channel', error: err });
  }
};

export const getChatRooms = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!req.user || !req.user._id) {
      console.warn('Missing user ID in request object');
    }

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const allRooms = await Chat.find({
      isPrivate: false,
    })
      .skip((page - 1) * limit)
      .limit(limit);

    let userRooms = await Chat.find({
      members: { $elemMatch: { user: req.user._id } },
      isPrivate: false,
    });

    const userId = req.user._id.toString();
    userRooms = userRooms.filter((room: ChatDocument) => {
      const user = room.members.find((m) => m.user.toString() === userId);
      return !user?.roles.includes('Banned');
    });

    const total = await Chat.countDocuments();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    res.json({
      allRooms,
      userRooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(safePage / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get chat rooms', error: err });
  }
};

// Private chat rooms

export const getOrCreatePrivateChat = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.targetUserId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You can't DM yourself." });
    }

    let chat = await Chat.findOne({
      isPrivate: true,
      members: {
        $all: [
          { $elemMatch: { user: currentUserId } },
          { $elemMatch: { user: targetUserId } },
        ],
      },
      $expr: { $eq: [{ $size: '$members' }, 2] },
    });

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!chat) {
      chat = await Chat.create({
        name: `${currentUser.username} & ${targetUser.username}`,
        topic: '',
        thumbnail: '',
        isPrivate: true,
        members: [
          { user: currentUserId, roles: [] },
          { user: targetUserId, roles: [] },
        ],
        roles: [],
      });
    }

    return res.status(200).json({ _id: chat._id });
  } catch (err) {
    console.error('Failed to get or create private chat:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPrivateChatRooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const privateChats = await Chat.find({
      isPrivate: true,
      members: { $elemMatch: { user: userId } },
    }).populate('members.user', 'username avatar status pronouns');

    const chatsWithOtherUser = privateChats.map((chat: ChatDocument) => {
      const otherMember = chat.members.find((member) => {
        const user = member.user as any;
        const memberId = user._id ?? user;
        return !memberId.equals(userId);
      });

      return {
        _id: chat._id,
        name: chat.name,
        isPrivate: true,
        updatedAt: chat.updatedAt,
        otherUser: otherMember?.user,
      };
    });

    return res.status(200).json(chatsWithOtherUser);
  } catch (err) {
    console.error('Failed to get private chat rooms:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
