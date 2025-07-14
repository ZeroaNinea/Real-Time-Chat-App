import { Server, Socket } from 'socket.io';

export function registerTypingHandlers(io: Server, socket: Socket) {
  socket.on('typingStart', ({ chatId, channelId }) => {
    const channelRoom = `${chatId}:${channelId}`;
    socket.to(channelRoom).emit('userTypingStart', {
      userId: socket.data.user._id,
      chatId,
      channelId,
    });
  });

  socket.on('typingStop', ({ chatId, channelId }) => {
    const channelRoom = `${chatId}:${channelId}`;
    socket.to(channelRoom).emit('userTypingStop', {
      userId: socket.data.user._id,
      chatId,
      channelId,
    });
  });
}
