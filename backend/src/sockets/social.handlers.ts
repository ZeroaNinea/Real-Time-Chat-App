import { Server, Socket } from 'socket.io';

import mongoose, { ObjectId } from 'mongoose';

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

  socket.on(
    'acceptFriendRequest',
    async ({ notificationId, senderId }, callback) => {
      try {
        const receiverId = socket.data.user._id.toString();
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver)
          return callback?.({ error: 'User not found' });

        if (
          !sender.pendingRequests?.some(
            (id: ObjectId) => id.toString() === receiverId
          )
        )
          return callback?.({ error: 'Friend request not found' });

        if (senderId === receiverId)
          return callback?.({
            error: 'Cannot accept friend request from yourself',
          });

        if (receiver.banlist?.includes(senderId))
          return callback?.({ error: 'User is banned' });

        if (sender.banlist?.includes(receiverId))
          return callback?.({ error: 'You are banned by the user' });

        sender.friends?.push(receiverId);
        receiver.friends?.push(senderId);

        sender.pendingRequests = sender.pendingRequests.filter(
          (id: string) => id.toString() !== receiverId
        );

        await sender.save();
        await receiver.save();

        await Notification.findByIdAndDelete(notificationId);

        const acceptNotification = await new Notification({
          sender: receiverId,
          recipient: senderId,
          type: 'friend-accepted',
          message: `${receiver.username} accepted your friend request`,
          link: '/friends',
        }).save();

        const populatedAccept = await acceptNotification.populate(
          'sender',
          'username avatar'
        );
        io.to(senderId).emit('notification', populatedAccept);
        io.to(socket.data.user._id.toString()).emit('notificationDeleted', {
          notificationId,
        });

        const populatedSender = await sender.populate(
          'friends',
          'username avatar bio pronouns status friends banlist pendingRequests'
        );
        const populatedReceiver = await receiver.populate(
          'friends',
          'username avatar bio pronouns status friends banlist pendingRequests'
        );

        io.to(socket.data.user._id.toString()).emit(
          'friendAdded',
          populatedSender
        );
        io.to(senderId).emit('friendAddedByOther', populatedReceiver);

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    }
  );

  socket.on(
    'declineFriendRequest',
    async ({ notificationId, senderId }, callback) => {
      try {
        const receiverId = socket.data.user._id.toString();
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver)
          return callback?.({ error: 'User not found' });

        if (
          !sender.pendingRequests?.some(
            (id: ObjectId) => id.toString() === receiverId
          )
        )
          return callback?.({ error: 'Friend request not found' });

        await Notification.findByIdAndDelete(notificationId);

        sender.pendingRequests = sender.pendingRequests.filter(
          (id: string) => id.toString() !== receiverId
        );
        await sender.save();

        const declineNotification = await new Notification({
          sender: receiverId,
          recipient: senderId,
          type: 'friend-declined',
          message: `${receiver.username} declined your friend request`,
          link: '/friends',
        }).save();

        const populatedDecline = await declineNotification.populate(
          'sender',
          'username avatar'
        );

        io.to(senderId).emit('notification', populatedDecline);
        io.to(socket.data.user._id.toString()).emit('notificationDeleted', {
          notificationId,
        });
        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    }
  );

  socket.on('removeFriend', async (friendId, callback) => {
    try {
      const currentUserId = socket.data.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return callback?.({ error: 'Invalid friend ID' });
      }

      const [userExists, friendExists] = await Promise.all([
        User.exists({ _id: currentUserId }),
        User.exists({ _id: friendId }),
      ]);
      if (!userExists || !friendExists) {
        return callback?.({ error: 'User not found' });
      }

      await Promise.all([
        User.updateOne(
          { _id: currentUserId },
          { $pull: { friends: friendId } }
        ),
        User.updateOne(
          { _id: friendId },
          { $pull: { friends: currentUserId } }
        ),
      ]);

      io.to(currentUserId).emit('friendRemoved', { friendId });
      io.to(friendId).emit('friendRemovedByOther', { userId: currentUserId });

      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
