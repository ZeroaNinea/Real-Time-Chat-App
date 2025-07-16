import { Server, Socket } from 'socket.io';

export function registerIdleHandlers(io: Server, socket: Socket) {
  socket.on('userIdle', () => {
    const userId = socket.data.user._id.toString();

    if (!userId) return;
    io.emit('userIdle', userId);
  });

  socket.on('userActive', () => {
    const userId = socket.data.user._id.toString();

    if (!userId) return;
    io.emit('userActive', userId);
  });
}
