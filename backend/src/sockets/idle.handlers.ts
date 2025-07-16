import { Server, Socket } from 'socket.io';

export function registerIdleHandlers(io: Server, socket: Socket) {
  socket.on('userIdle', () => {
    const userId = socket.data.user._id.toString();

    if (!userId) return;

    console.log('User idle:', userId);
    io.emit('userIdle', userId);
  });

  socket.on('userActive', () => {
    const userId = socket.data.user._id.toString();

    if (!userId) return;

    console.log('User active:', userId);
    io.emit('userActive', userId);
  });
}
