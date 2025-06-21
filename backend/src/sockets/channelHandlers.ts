import { Server, Socket } from 'socket.io';
import { Chat } from '../models/chat.model';
import { Member } from '../../types/member.alias';
import { addChannelService } from '../services/chat.service';

export function registerChannelHandlers(io: Server, socket: Socket) {
  socket.on('addChannel', async ({ chatId, channelName }) => {
    try {
      const userId = socket.data.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const isMember = chat.members.some((m: Member) => m.user.equals(userId));

      if (!isMember) {
        throw new Error('You are not a member of this chat');
      }

      if (chat.isPrivate) {
        throw new Error('Private chat rooms cannot have channels');
      }

      const member = chat.members.find((m: Member) => m.user.equals(userId));
      const isAdmin =
        member?.roles.includes('Admin') || member?.roles.includes('Owner');

      if (!isAdmin) {
        throw new Error('Only admins can add channels');
      }

      const newChannel = await addChannelService(chatId, channelName, userId);

      io.to(chatId).emit('channelAdded', newChannel);
    } catch (err) {
      console.error('Channel addition failed:', err);
      socket.emit('error', (err as Error).message);
    }
  });
}
