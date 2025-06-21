import { Server, Socket } from 'socket.io';

import { registerMessageHandlers } from './mesage.handlers';
import { registerChannelHandlers } from './channel.handlers';
import { registerAuthHandlers } from './auth.handlers';

export function registerSocketHandlers(io: Server, socket: Socket) {
  registerMessageHandlers(io, socket);
  registerChannelHandlers(io, socket);
  registerAuthHandlers(io, socket);
}
