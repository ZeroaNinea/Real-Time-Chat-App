import { Server, Socket } from 'socket.io';
import { registerMessageHandlers } from './mesageHandlers';

export function registerSocketHandlers(io: Server, socket: Socket) {
  registerMessageHandlers(io, socket);
}
