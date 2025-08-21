import { Server, Socket } from 'socket.io';
import mongoose, { ObjectId } from 'mongoose';

import userHelper from '../helpers/user-helper';

import { User } from '../models/user.model';
import { Notification } from '../models/notification.model';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';

import { Member } from '../../types/member.alias';

export function registerSocialHandlers(io: Server, socket: Socket) {
  socket.on('sendFriendRequest', async ({ receiverId }, callback) => {
    try {
      const senderId = socket.data.user._id.toString();
      const sender = await userHelper.findUserById(senderId);
      const receiver = await userHelper.findUserById(receiverId);

      if (!sender || !receiver)
        return callback?.({ error: 'User is not found.' });

      if (receiver.friends?.includes(senderId))
        return callback?.({ error: 'Already friends.' });

      if (sender.pendingRequests?.includes(receiverId))
        return callback?.({ error: 'Friend request already sent.' });

      if (senderId === receiverId)
        return callback?.({
          error: 'Cannot send friend request to yourself.',
        });

      if (receiver.banlist?.includes(senderId))
        return callback?.({ error: 'User is banned.' });

      if (sender.banlist?.includes(receiverId))
        return callback?.({ error: 'You are banned by the user.' });

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
      callback?.({ error: 'Server error during sending a friend request.' });
    }
  });

  socket.on(
    'acceptFriendRequest',
    async ({ notificationId, senderId }, callback) => {
      try {
        const receiverId = socket.data.user._id.toString();
        const sender = await userHelper.findUserById(senderId);
        const receiver = await userHelper.findUserById(receiverId);

        if (!sender || !receiver)
          return callback?.({ error: 'User is not found.' });

        if (
          !sender.pendingRequests?.some(
            (id: ObjectId) => id.toString() === receiverId
          )
        )
          return callback?.({ error: 'Friend request is not found.' });

        if (senderId === receiverId)
          return callback?.({
            error: 'You cannot accept friend request from yourself.',
          });

        if (receiver.banlist?.includes(senderId))
          return callback?.({ error: 'User is banned.' });

        if (sender.banlist?.includes(receiverId))
          return callback?.({ error: 'You are banned by the user.' });

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
        callback?.({
          error: 'Server error during accepting a friend request.',
        });
      }
    }
  );

  socket.on(
    'declineFriendRequest',
    async ({ notificationId, senderId }, callback) => {
      try {
        const receiverId = socket.data.user._id.toString();
        const sender = await userHelper.findUserById(senderId);
        const receiver = await userHelper.findUserById(receiverId);

        if (!sender || !receiver)
          return callback?.({ error: 'User is not found.' });

        if (
          !sender.pendingRequests?.some(
            (id: ObjectId) => id.toString() === receiverId
          )
        ) {
          return callback?.({ error: 'Friend request is not found.' });
        }

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
        callback?.({
          error: 'Server error during declining a friend request.',
        });
      }
    }
  );

  socket.on('removeFriend', async (friendId, callback) => {
    try {
      const currentUserId = socket.data.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return callback?.({ error: 'Invalid friend ID.' });
      }

      const [userExists, friendExists] = await Promise.all([
        User.exists({ _id: currentUserId }),
        User.exists({ _id: friendId }),
      ]);
      if (!userExists || !friendExists) {
        return callback?.({ error: 'User is not found.' });
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
      callback?.({ error: 'Server error during removing a friend.' });
    }
  });

  socket.on('banUser', async (userId, callback) => {
    try {
      const currentUserId = socket.data.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return callback?.({ error: 'Invalid user ID.' });
      }

      if (userId === currentUserId) {
        return callback?.({ error: 'You cannot ban yourself.' });
      }

      const [user, currentUser] = await Promise.all([
        User.findById(userId),
        User.findById(currentUserId),
      ]);

      if (!user || !currentUser) {
        return callback?.({ error: 'User is not found.' });
      }

      if (currentUser.banlist.includes(user._id)) {
        return callback?.({ error: 'User is already banned.' });
      }

      await User.updateOne(
        { _id: currentUserId },
        {
          $addToSet: { banlist: user._id },
          $pull: { friends: user._id },
        }
      );
      await User.updateOne(
        { _id: user._id },
        {
          $pull: { friends: currentUser._id },
        }
      );

      const populatedUser = await user.populate(
        'banlist',
        'username avatar bio pronouns status friends banlist pendingRequests'
      );
      const populatedCurrentUser = await currentUser.populate(
        'banlist',
        'username avatar bio pronouns status friends banlist pendingRequests'
      );

      io.to(currentUserId).emit('userBanned', populatedUser);
      io.to(userId).emit('userBannedByOther', populatedCurrentUser);

      io.to(currentUserId).emit('friendRemoved', { friendId: userId });
      io.to(userId).emit('friendRemovedByOther', { userId: currentUserId });

      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during banning a user.' });
    }
  });

  socket.on('unbanUser', async (userId, callback) => {
    try {
      const currentUserId = socket.data.user._id.toString();

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return callback?.({ error: 'Invalid user ID.' });
      }

      if (userId === currentUserId) {
        return callback?.({ error: 'You cannot unban yourself.' });
      }

      const [user, currentUser] = await Promise.all([
        User.findById(userId),
        User.findById(currentUserId),
      ]);

      if (!user || !currentUser) {
        return callback?.({ error: 'User is not found.' });
      }

      if (!currentUser.banlist.includes(user._id)) {
        return callback?.({ error: 'User is not banned.' });
      }

      await User.updateOne(
        { _id: currentUserId },
        { $pull: { banlist: user._id } }
      );

      io.to(currentUserId).emit('userUnbanned', {
        userId: user._id,
      });
      io.to(userId).emit('userUnbannedByOther', { userId: currentUser._id });

      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error during unbanning a user.' });
    }
  });

  socket.on(
    'deletePrivateChatRequest',
    async ({ receiverId, chatId }, callback) => {
      try {
        const senderId = socket.data.user._id.toString();
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        const chat = await Chat.findById(chatId);

        if (!sender || !receiver || !chat) {
          return callback?.({ error: 'Invalid data provided.' });
        }

        if (sender.deletionRequests.includes(receiverId)) {
          return callback?.({ error: 'Deletion request is already sent.' });
        }

        sender.deletionRequests.push(receiverId);
        await sender.save();

        if (
          !chat.isPrivate ||
          !chat.members.some((m: Member) => m.user.equals(senderId))
        ) {
          return callback?.({
            error: 'You are not authorized to delete this chat.',
          });
        }

        const existing = await Notification.findOne({
          sender: senderId,
          recipient: receiverId,
          type: 'private-chat-deletion-request',
          link: chatId,
        });

        if (existing) {
          return callback?.({ error: 'Deletion request is already sent.' });
        }

        const notification = new Notification({
          sender: senderId,
          recipient: receiverId,
          type: 'private-chat-deletion-request',
          message: `${sender.username} wants to delete your private chat`,
          link: chatId,
        });

        await notification.save();

        const populatedNotification = await notification.populate(
          'sender',
          'username avatar'
        );
        io.to(receiverId.toString()).emit(
          'notification',
          populatedNotification
        );

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error during deletion request.' });
      }
    }
  );

  socket.on(
    'confirmDeletePrivateChat',
    async ({ chatId, recipientId }, callback) => {
      try {
        const confirmerId = socket.data.user._id.toString();
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.isPrivate) {
          return callback?.({ error: 'Chat not found or not private' });
        }

        const isMember = chat.members.some((m: Member) =>
          m.user.equals(confirmerId)
        );
        if (!isMember) {
          return callback?.({ error: 'You are not a member of this chat' });
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
          return callback?.({ error: 'Recipient not found' });
        }

        if (!recipient.deletionRequests.includes(confirmerId)) {
          return callback?.({ error: 'Deletion request not found' });
        }

        recipient.deletionRequests = recipient.deletionRequests.filter(
          (id: string) => id === confirmerId
        );
        await recipient.save();

        await Message.deleteMany({ chatId });
        await chat.deleteOne();

        const deletionRequest = await Notification.findOne({
          sender: recipientId,
          recipient: confirmerId,
          type: 'private-chat-deletion-request',
          link: chatId,
        });

        await Notification.deleteOne({
          _id: deletionRequest._id,
        });

        const notification = new Notification({
          sender: confirmerId,
          recipient: recipientId,
          type: 'private-chat-deletion-confirmed',
          message: `Private chat was deleted by ${socket.data.user.username}`,
        });

        await notification.save();
        const populated = await notification.populate(
          'sender',
          'username avatar'
        );

        io.to(recipientId).emit('notification', populated);
        io.to(confirmerId).emit('notificationDeleted', {
          notificationId: deletionRequest._id,
        });

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    }
  );

  socket.on(
    'declinePrivateChatDeletion',
    async ({ chatId, recipientId }, callback) => {
      try {
        const declinerId = socket.data.user._id.toString();

        const notification = await Notification.findOneAndDelete({
          sender: recipientId,
          recipient: declinerId,
          type: 'private-chat-deletion-request',
          link: chatId,
        });

        if (!notification) {
          return callback?.({ error: 'Deletion request not found' });
        }

        const declineNotification = new Notification({
          sender: declinerId,
          recipient: recipientId,
          type: 'private-chat-deletion-declined',
          message: `Private chat deletion request was declined by ${socket.data.user.username}`,
        });

        const recipient = await User.findById(recipientId);

        if (!recipient) {
          return callback?.({ error: 'Recipient not found' });
        }

        if (!recipient.deletionRequests.includes(declinerId)) {
          return callback?.({ error: 'Deletion request not found' });
        }

        recipient.deletionRequests = recipient.deletionRequests.filter(
          (id: string) => id === declinerId
        );
        await recipient.save();

        await declineNotification.save();

        const populated = await declineNotification.populate(
          'sender',
          'username avatar'
        );

        io.to(recipientId).emit('notification', populated);
        io.to(declinerId).emit('notificationDeleted', {
          notificationId: notification._id,
        });

        callback?.({ success: true });
      } catch (err) {
        console.error(err);
        callback?.({ error: 'Server error' });
      }
    }
  );

  socket.on('deleteNotification', async (notificationId, callback) => {
    try {
      const currentNotification = await Notification.findById(notificationId);

      if (
        socket.data.user._id.toString() !==
        currentNotification.recipient.toString()
      )
        return callback?.({ error: 'Unauthorized' });

      await Notification.findByIdAndDelete(notificationId);

      io.to(socket.data.user._id.toString()).emit('notificationDeleted', {
        notificationId,
      });
      callback?.({ success: true });
    } catch (err) {
      console.error(err);
      callback?.({ error: 'Server error' });
    }
  });
}
