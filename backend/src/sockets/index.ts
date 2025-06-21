import { Server, Socket } from 'socket.io';
import { registerMessageHandlers } from './mesageHandlers';
import { registerChannelHandlers } from './channelHandlers';

export function registerSocketHandlers(io: Server, socket: Socket) {
  registerMessageHandlers(io, socket);
  registerChannelHandlers(io, socket);
}
