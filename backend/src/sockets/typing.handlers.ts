import { Server, Socket } from 'socket.io';

export function registerTypingHandlers(io: Server, socket: Socket) {
  socket.on('typingStart', ({ chatId, channelId }) => {
    console.log('typingStart', { chatId, channelId });
    const channelRoom = `${chatId}:${channelId}`;

    io.to(channelRoom).emit('userTypingStart', {
      userId: socket.data.user._id,
      chatId,
      channelId,
    });
  });

  socket.on('typingStop', ({ chatId, channelId }) => {
    console.log('typingStop', { chatId, channelId });
    const channelRoom = `${chatId}:${channelId}`;

    io.to(channelRoom).emit('userTypingStop', {
      userId: socket.data.user._id,
      chatId,
      channelId,
    });
  });
}
