import { Server, Socket } from 'socket.io';

import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { Member } from '../../types/member.alias';
import { User } from '../models/user.model';

import { checkPermission } from '../services/check-permission.service';

export function registerMessageHandlers(io: Server, socket: Socket) {
  socket.on('message', async ({ chatId, channelId, message: text }) => {
    try {
      const sender = socket.data.user._id;

      const chat = await Chat.findById(chatId);
      const isMember = chat?.members.some((m: Member) => m.user.equals(sender));
      if (!isMember) {
        return socket.emit('error', 'You are not a member of this chat.');
      }

      if (chat.isPrivate) {
        return socket.emit('error', 'Private chat rooms cannot have channels.');
      }

      const message = await new Message({
        chatId,
        channelId,
        sender,
        text,
      }).save();

      io.to(chatId).emit('message', message);
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Server error during sending a message.');
    }
  });

  socket.on('privateMessage', async ({ chatId, message: text }) => {
    try {
      const senderId = socket.data.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return socket.emit('error', 'Chat is not found.');
      }

      if (!chat.isPrivate) {
        return socket.emit('error', 'This chat is not private.');
      }

      const member1 = chat.members.find((m: Member) => m.user.equals(senderId));
      const member2 = chat.members.find(
        (m: Member) => !m.user.equals(senderId)
      );

      if (!member1 || !member2) {
        return socket.emit('error', 'Members are not found.');
      }

      const senderUser = await User.findById(senderId);
      const otherUser = await User.findById(member2.user);

      if (!senderUser || !otherUser) {
        return socket.emit('error', 'Users are not found.');
      }

      if (
        senderUser.banlist.includes(otherUser._id) ||
        otherUser.banlist.includes(senderUser._id)
      ) {
        return socket.emit(
          'error',
          'You cannot message this user (ban restriction).'
        );
      }

      const message = await new Message({
        chatId,
        sender: senderId,
        text,
      }).save();

      io.to(chatId).emit('message', message);
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Server error during sending a message.');
    }
  });

  socket.on('deleteMessage', async ({ messageId }, callback) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      const chat = await Chat.findById(message.chatId);
      if (!chat) {
        return callback?.({ error: 'Chat not found' });
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      const currentUserPermissions = await checkPermission(chat, member);

      const isSender = message.sender.equals(socket.data.user._id);
      const isPrivileged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        member?.roles.includes('Moderator') ||
        currentUserPermissions.includes('canDeleteMessages');

      if (!isSender && !isPrivileged) {
        return callback?.({ error: 'You are not allowed to delete messages' });
      }

      await Message.findByIdAndDelete(messageId);

      io.to(chat._id.toString()).emit('messageDeleted', { messageId });
      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });

  socket.on('editMessage', async ({ messageId, text }, callback) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      const chat = await Chat.findById(message.chatId);
      if (!chat) {
        return callback?.({ error: 'Chat not found' });
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      if (!member) {
        return callback?.({ error: 'You are not a member of this chat' });
      }

      const isSender = message.sender.equals(socket.data.user._id);

      if (!isSender) {
        return callback?.({
          error: 'Only the sender of the message can edit it',
        });
      }

      message.text = text;
      message.isEdited = true;
      await message.save();

      io.to(chat._id.toString()).emit('messageEdited', message);
      callback?.({ success: true, message });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });

  socket.on('reply', async ({ messageId, text }, callback) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      const chat = await Chat.findById(message.chatId);
      if (!chat) {
        return callback?.({ error: 'Chat not found' });
      }

      const member = chat.members.find((m: Member) =>
        m.user.equals(socket.data.user._id)
      );

      if (!member) {
        return callback?.({ error: 'You are not a member of this chat' });
      }

      if (message.sender.equals(socket.data.user._id)) {
        return callback?.({
          error: 'You cannot reply to your own message',
        });
      }

      const reply = await Message.create({
        chatId: message.chatId,
        channelId: message.channelId,
        sender: socket.data.user._id,
        text,
        replyTo: message._id,
      });

      io.to(chat._id.toString()).emit('messageReplied', reply);
      io.to(chat._id.toString()).emit('messageAddedToReplies', message);
      callback?.({ success: true, message: reply });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });

  socket.on('privateReply', async ({ messageId, text }, callback) => {
    try {
      const senderId = socket.data.user._id;

      const message = await Message.findById(messageId);
      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      const chat = await Chat.findById(message.chatId);
      if (!chat || !chat.isPrivate) {
        return callback?.({ error: 'Private chat not found' });
      }

      const member1 = chat.members.find((m: Member) => m.user.equals(senderId));
      const member2 = chat.members.find(
        (m: Member) => !m.user.equals(senderId)
      );

      if (!member1 || !member2) {
        return callback?.({ error: 'Invalid private chat' });
      }

      const senderUser = await User.findById(senderId);
      const otherUser = await User.findById(member2.user);

      if (!senderUser || !otherUser) {
        return callback?.({ error: 'Users not found' });
      }

      if (
        senderUser.banlist.includes(otherUser._id) ||
        otherUser.banlist.includes(senderUser._id)
      ) {
        return callback?.({
          error: 'You cannot reply in this chat (ban restriction)',
        });
      }

      if (message.sender.equals(senderId)) {
        return callback?.({ error: 'You cannot reply to your own message' });
      }

      const reply = await Message.create({
        chatId: message.chatId,
        sender: senderId,
        text,
        replyTo: message._id,
      });

      io.to(chat._id.toString()).emit('messageReplied', reply);
      io.to(chat._id.toString()).emit('messageAddedToReplies', message);
      callback?.({ success: true, message: reply });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
