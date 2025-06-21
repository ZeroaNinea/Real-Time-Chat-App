import { Server, Socket } from 'socket.io';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { Member } from '../../types/member.alias';

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
}
