import { Server, Socket } from 'socket.io';
import { registerMessageHandlers } from './mesage.handlers';
import { registerChannelHandlers } from './channel.handlers';

export function registerSocketHandlers(io: Server, socket: Socket) {
  registerMessageHandlers(io, socket);
  registerChannelHandlers(io, socket);
}
