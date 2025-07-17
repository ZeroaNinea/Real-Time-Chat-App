import { Socket, Server } from 'socket.io';
import { Message } from '../models/message.model';

export function registerReactionHandlers(io: Server, socket: Socket) {
  socket.on('toggleReaction', ({ chatId, messageId, reaction }, callback) => {
    const currentUserId = socket.data.user._id;

    if (!messageId || !reaction) {
      return callback?.({ error: 'Missing messageId or reaction' });
    }

    const message = Message.findById(messageId);
    if (!message) {
      return callback?.({ error: 'Message not found' });
    }

    io.to(chatId).emit('reactionToggled', message);
  });
}
