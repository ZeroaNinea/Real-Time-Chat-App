import { Socket, Server } from 'socket.io';
import { Message } from '../models/message.model';
import { Reaction } from '../../types/reaction.alias';

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

    if (message.reactions.some((r: Reaction) => r.user.equals(currentUserId))) {
      message.reactions = message.reactions.filter(
        (r: Reaction) => !r.user.equals(currentUserId)
      );
    } else {
      message.reactions.push({ emoji: reaction, user: currentUserId });
    }

    io.to(chatId).emit('reactionToggled', message);
  });
}
