import { Server, Socket } from 'socket.io';

import { User } from '../models/user.model';
import { Notification } from '../models/notification.model';

export function registerSocialHandlers(io: Server, socket: Socket) {
  socket.on('sendFriendRequest', async ({ receiverId }, callback) => {
    try {
      const senderId = socket.data.user._id.toString();
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) return callback?.({ error: 'User not found' });

      if (receiver.friends?.includes(senderId))
        return callback?.({ error: 'Already friends' });

      if (sender.pendingRequests?.includes(receiverId))
        return callback?.({ error: 'Friend request already sent' });

      if (senderId === receiverId)
        return callback?.({
          error: 'Cannot send friend request to yourself',
        });

      if (receiver.banlist?.includes(senderId))
        return callback?.({ error: 'User is banned' });

      if (sender.banlist?.includes(receiverId))
        return callback?.({ error: 'You are banned by the user' });

      sender.pendingRequests?.push(receiverId);
      await sender.save();

      const notification = new Notification({
        sender: senderId,
        recipient: receiverId,
        type: 'friend-request',
        message: `${sender.username} sent you a friend request`,
        link: '/friends',
      });

      await notification.save();

      const targetSocketId = receiver._id.toString();

      if (targetSocketId) {
        const populatedNotification = await notification.populate(
          'sender',
          'username avatar'
        );
        io.to(targetSocketId).emit('notification', populatedNotification);
      }

      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
