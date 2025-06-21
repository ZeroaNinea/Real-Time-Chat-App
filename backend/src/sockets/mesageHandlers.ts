import { Server, Socket } from 'socket.io';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { Member } from '../../types/member.alias';
import { User } from '../models/user.model';

export function registerMessageHandlers(io: Server, socket: Socket) {
  socket.on('message', async ({ chatId, channelId, message: text }) => {
    try {
      const sender = socket.data.user._id;

      const chat = await Chat.findById(chatId);
      const isMember = chat?.members.some((m: Member) => m.user.equals(sender));
      if (!isMember) {
        return socket.emit('error', 'You are not a member of this chat.');
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
      socket.emit('error', 'Message failed to send');
    }
  });

  socket.on('privateMessage', async ({ chatId, message: text }) => {
    try {
      const senderId = socket.data.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat || !chat.isPrivate) {
        return socket.emit('error', 'Invalid private chat');
      }

      const member1 = chat.members.find((m: Member) => m.user.equals(senderId));
      const member2 = chat.members.find(
        (m: Member) => !m.user.equals(senderId)
      );

      if (!member1 || !member2) {
        return socket.emit('error', 'Invalid private chat');
      }

      const senderUser = await User.findById(senderId);
      const otherUser = await User.findById(member2.user);

      if (!senderUser || !otherUser) {
        return socket.emit('error', 'Users not found');
      }

      if (
        senderUser.banlist.includes(otherUser._id) ||
        otherUser.banlist.includes(senderUser._id)
      ) {
        return socket.emit(
          'error',
          'You cannot message this user (ban restriction)'
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
      socket.emit('error', 'Failed to send private message');
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

      const isSender = message.sender.equals(socket.data.user._id);
      const isPrivileged =
        member?.roles.includes('Admin') ||
        member?.roles.includes('Owner') ||
        member?.roles.includes('Moderator');

      if (!isSender && !isPrivileged) {
        return callback?.({ error: 'Only admins can delete messages' });
      }

      await Message.findByIdAndDelete(messageId);

      io.to(chat._id.toString()).emit('messageDeleted', { messageId });
      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
