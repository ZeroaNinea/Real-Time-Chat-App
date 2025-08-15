import { Server, Socket } from 'socket.io';

export function registerIdleHandlers(io: Server, socket: Socket) {
  socket.on('userIdle', () => {
    const userId = socket.data.user._id.toString();

    io.emit('userIdle', userId);
  });

  socket.on('userActive', () => {
    const userId = socket.data.user._id.toString();

    io.emit('userActive', userId);
  });
}
