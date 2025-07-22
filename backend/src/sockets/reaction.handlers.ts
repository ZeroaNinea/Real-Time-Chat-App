import { Socket, Server } from 'socket.io';
import { Types } from 'mongoose';

import emojiRegex from 'emoji-regex';

import { Message } from '../models/message.model';
import { Reaction } from '../../types/reaction.alias';
import { Chat } from '../models/chat.model';
import { Member } from '../../types/member.alias';

export function registerReactionHandlers(io: Server, socket: Socket) {
  socket.on(
    'toggleReaction',
    async ({ chatId, messageId, reaction }, callback) => {
      try {
        const currentUserId = socket.data.user._id;

        if (!messageId || !reaction) {
          return callback?.({ error: 'Missing messageId or reaction' });
        }

        const regex = emojiRegex();

        if (!regex.test(reaction.trim())) {
          return callback?.({ error: 'Reaction must be a valid emoji' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ error: 'Message not found' });
        }

        const matched = reaction.trim().match(regex);
        if (
          !matched ||
          matched.length !== 1 ||
          matched[0] !== reaction.trim()
        ) {
          return callback?.({ error: 'Only one emoji is allowed' });
        }

        const currentChatRoom = await Chat.findById(chatId);
        if (!currentChatRoom) {
          return callback?.({ error: 'Chat room not found' });
        }

        if (
          !currentChatRoom.members.some((m: Member) =>
            m.user.equals(currentUserId)
          )
        ) {
          return callback?.({
            error: 'You are not a member of this chat room',
          });
        }

        if (
          message.reactions.length >= 20 &&
          !message.reactions.find((r: Reaction) => r.emoji === reaction)
        ) {
          return callback?.({ error: 'Too many reactions' });
        }

        const reactionEntry = message.reactions.find(
          (r: Reaction) => r.emoji === reaction
        );

        if (reactionEntry) {
          const userIndex = reactionEntry.users.findIndex((u: Types.ObjectId) =>
            u.equals(currentUserId)
          );

          if (userIndex !== -1) {
            reactionEntry.users.splice(userIndex, 1);

            if (reactionEntry.users.length === 0) {
              message.reactions = message.reactions.filter(
                (r: Reaction) => r.emoji !== reaction
              );
            }
          } else {
            reactionEntry.users.push(currentUserId);
          }
        } else {
          message.reactions.push({ emoji: reaction, users: [currentUserId] });
        }

        await message.save();

        io.to(chatId).emit('reactionToggled', {
          messageId,
          reaction,
          userId: currentUserId,
        });

        return callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: err });
      }
    }
  );
}
