import {
  afterNextRender,
  Component,
  inject,
  OnChanges,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { ChatService } from '../../shared/services/chat-service/chat.service';

import { ChatRooms } from '../../shared/models/chat-rooms.interface';
import { Chat } from '../../shared/models/chat.model';
import { PopulatedNotification } from '../../shared/models/notification.model';
import { AbbreviatedPopulatedUser } from '../../shared/models/populated-user.model';

import { ChatRoomListComponent } from '../chat-room-list/chat-room-list.component';
import { HeaderComponent } from '../header/header.component';
import { FriendListComponent } from '../friend-list/friend-list.component';
import { NotificationListComponent } from '../notification-list/notification-list.component';

import { WebsocketService } from '../../shared/services/websocket/websocket.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-main',
  imports: [
    RouterModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ChatRoomListComponent,
    HeaderComponent,
    FriendListComponent,
    NotificationListComponent,
  ],
  standalone: true,
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnChanges {
  searchTerm = signal('');

  private chatService = inject(ChatService);
  private router = inject(Router);
  private _snackbar = inject(MatSnackBar);
  private wsService = inject(WebsocketService);
  private authService = inject(AuthService);

  currentUserId = signal<string | undefined>(undefined);

  chatRooms!: ChatRooms;
  notifications!: PopulatedNotification[];
  friends!: AbbreviatedPopulatedUser[];
  banList!: AbbreviatedPopulatedUser[];

  constructor() {
    afterNextRender(() => {
      this.chatService.getChatRooms(1, 20).subscribe((rooms) => {
        this.chatRooms = rooms;
        this.currentUserId.set(this.authService.currentUser()?.id);

        this.connect();
      });
    });
  }

  ngOnChanges() {
    console.log(this.authService.currentUser());
  }

  connect() {
    this.wsService.disconnect();
    this.wsService.connect();

    if (this.currentUserId) {
      this.wsService.joinChatRoom(this.currentUserId()!);
    }

    this.chatService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
      },
    });

    this.chatService.getFriends().subscribe({
      next: (friends) => {
        this.friends = friends;
      },
      error: (err) => {
        console.error('Failed to load friends', err);
      },
    });

    this.chatService.getBanList().subscribe({
      next: (banList) => {
        this.banList = banList;
      },
      error: (err) => {
        console.error('Failed to load ban list', err);
      },
    });

    this.wsService.listenChatRoomLeft().subscribe((chat) => {
      this.chatRooms = {
        ...this.chatRooms,
        userRooms: this.chatRooms.userRooms.filter((c) => c._id !== chat._id),
      };
    });

    this.wsService.listenNotifications().subscribe((notification) => {
      this.notifications.unshift(notification);
    });

    this.wsService
      .listenNotificationDeletions()
      .subscribe(({ notificationId }) => {
        this.notifications = this.notifications.filter(
          (n) => n._id !== notificationId
        );
      });

    this.wsService.listenUserUpdates().subscribe((user) => {
      this.friends = this.friends.map((f) => {
        if (f._id === user._id) {
          return user;
        }
        return f;
      });
    });

    this.wsService.listenFriendAdditions().subscribe((friend) => {
      this.friends = [...this.friends, friend];
    });

    this.wsService.listenFriendAdditionsByOthers().subscribe((friend) => {
      this.friends = [...this.friends, friend];
    });

    this.wsService.listenFriendRemovings().subscribe(({ friendId }) => {
      this.friends = this.friends.filter((f) => f._id !== friendId);
    });

    this.wsService.listenFriendRemovesByOthers().subscribe(({ userId }) => {
      this.friends = this.friends.filter((f) => f._id !== userId);
    });

    this.wsService.listenUserBans().subscribe((user) => {
      this.banList = [...this.banList, user];
      this.friends = this.friends.filter((f) => f._id !== user._id);
    });

    this.wsService.listenUserBansByOther().subscribe((user) => {
      this.banList = [...this.banList, user];
      this.friends = this.friends.filter((f) => f._id !== user._id);
    });

    this.wsService.listenUserUnbans().subscribe(({ userId }) => {
      this.banList = this.banList.filter((u) => u._id !== userId);
    });

    this.wsService.listenUserUnbansByOther().subscribe(({ userId }) => {
      this.banList = this.banList.filter((u) => u._id !== userId);
    });
  }

  joinRoom(room: Chat) {
    this.wsService.emit('becomeMember', { chatId: room._id }, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to join room',
          'Close',
          { duration: 3000 }
        );
      } else {
        this.router.navigate(['/chat-room', room._id]);
        this._snackbar.open('Joined room!', 'Close', { duration: 2000 });
      }
    });

    // console.log('Joining room:', room);
  }

  leaveRoom(room: Chat) {
    this.wsService.emit('leaveChatRoom', { chatId: room._id }, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to leave chat room',
          'Close',
          { duration: 3000 }
        );
      } else {
        this._snackbar.open('Left chat room!', 'Close', { duration: 2000 });
      }
    });
  }

  visitRoom(room: Chat) {
    this.router.navigate(['/chat-room', room._id]);
  }

  createRoom() {
    this.router.navigate(['/chat-room']);
  }

  declainNotification(notification: PopulatedNotification) {
    this.wsService.emit(
      'declineFriendRequest',
      {
        notificationId: notification._id,
        senderId: notification.sender._id,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to decline notification',
            'Close',
            { duration: 3000 }
          );
        } else {
          this._snackbar.open('Declined friend request!', 'Close', {
            duration: 2000,
          });
        }
      }
    );
  }

  acceptNotification(notification: PopulatedNotification) {
    this.wsService.emit(
      'acceptFriendRequest',
      {
        notificationId: notification._id,
        senderId: notification.sender._id,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to accept notification',
            'Close',
            { duration: 3000 }
          );
        } else {
          this._snackbar.open('Accepted friend request!', 'Close', {
            duration: 2000,
          });
        }
      }
    );
  }

  deleteNotification(notification: PopulatedNotification) {
    const notificationId = notification._id;

    this.wsService.emit('deleteNotification', notificationId, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to delete notification',
          'Close',
          { duration: 3000 }
        );
      } else {
        this._snackbar.open('Deleted notification!', 'Close', {
          duration: 2000,
        });
      }
    });
  }

  removeFriend(friend: AbbreviatedPopulatedUser) {
    this.wsService.emit('removeFriend', friend._id, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to remove friend',
          'Close',
          { duration: 3000 }
        );
      } else {
        this._snackbar.open('Removed friend!', 'Close', { duration: 2000 });
      }
    });
  }

  banUser(user: AbbreviatedPopulatedUser) {
    this.wsService.emit('banUser', user._id, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to ban user',
          'Close',
          { duration: 3000 }
        );
      } else {
        this._snackbar.open('Banned user!', 'Close', { duration: 2000 });
      }
    });
  }

  unbanUser(user: AbbreviatedPopulatedUser) {
    this.wsService.emit('unbanUser', user._id, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to unban user',
          'Close',
          { duration: 3000 }
        );
      } else {
        this._snackbar.open('Unbanned user!', 'Close', { duration: 2000 });
      }
    });
  }

  messageFriend(targetUserId: string) {
    console.log(targetUserId);
    this.chatService.getOrCreatePrivateChat(targetUserId).subscribe((res) => {
      this.router.navigate(['/chat-room', res._id]);
    });
  }
}
