import { Server, Socket } from 'socket.io';
import { User } from '../models/user.model';

export function registerAuthHandlers(io: Server, socket: Socket) {
  socket.on('editStatus', async ({ status }, callback) => {
    try {
      const user = await User.findById(socket.data.user._id);
      if (!user) return callback?.({ error: 'User not found' });

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
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
