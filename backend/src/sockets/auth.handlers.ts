import { Server, Socket } from 'socket.io';
import userService from '../services/user.service';

export function registerAuthHandlers(io: Server, socket: Socket) {
  socket.on('editStatus', async ({ status }, callback) => {
    try {
      const user = await userService.findUserById(socket.data.user._id);

      user.status = status;
      await user.save();

      const filteredUser = {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        pronouns: user.pronouns,
        status: user.status,
      };

      io.emit('userUpdated', filteredUser);
      callback?.({ success: true, user });
    } catch (err) {
      callback?.({ error: 'Server error during status update.' });
    }
  });
}
