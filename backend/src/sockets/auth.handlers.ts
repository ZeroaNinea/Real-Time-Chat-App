import { Server, Socket } from 'socket.io';
import { User } from '../models/user.model';
import userHelper from '../helpers/user-helper';

export function registerAuthHandlers(io: Server, socket: Socket) {
  socket.on('editStatus', async ({ status }, callback) => {
    console.log('Handler started...');
    try {
      const user = await userHelper.findUserById(socket.data.user._id);
      // const user = await User.findById(socket.data.user._id);

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
      console.error('Error from the handler:', err);
      callback?.({ error: 'Server error during status update.' });
    }
  });
}
