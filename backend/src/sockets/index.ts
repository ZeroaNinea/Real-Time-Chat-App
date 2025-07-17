import { Server, Socket } from 'socket.io';

import { registerMessageHandlers } from './mesage.handlers';
import { registerChannelHandlers } from './channel.handlers';
import { registerAuthHandlers } from './auth.handlers';
import { registerMemberHandlers } from './member.handlers';
import { registerSocialHandlers } from './social.handlers';
import { registerTypingHandlers } from './typing.handlers';
import { registerIdleHandlers } from './idle.handlers';
import { registerReactionHandlers } from './reaction.handlers';

export function registerSocketHandlers(io: Server, socket: Socket) {
  registerMessageHandlers(io, socket);
  registerChannelHandlers(io, socket);
  registerAuthHandlers(io, socket);
  registerMemberHandlers(io, socket);
  registerSocialHandlers(io, socket);
  registerTypingHandlers(io, socket);
  registerIdleHandlers(io, socket);
  registerReactionHandlers(io, socket);
}
