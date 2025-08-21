import { Server, Socket } from 'socket.io';

export function registerTypingHandlers(io: Server, socket: Socket) {
  socket.on('typingStart', ({ chatId, channelId }, callback) => {
    const channelRoom = `${chatId}:${channelId}`;

    io.to(channelRoom).emit('userTypingStart', {
      userId: socket.data.user._id,
      chatId,
      channelId,
    });

    callback?.({ success: true });
  });

  socket.on('typingStop', ({ chatId, channelId }, callback) => {
    const channelRoom = `${chatId}:${channelId}`;

    io.to(channelRoom).emit('userTypingStop', {
      userId: socket.data.user._id,
      chatId,
      channelId,
    });

    callback?.({ success: true });
  });
}
