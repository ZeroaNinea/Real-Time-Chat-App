import {
  afterNextRender,
  Component,
  computed,
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
import { Notification } from '../../shared/models/notification.model';

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
  rooms = signal(['General', 'Gaming', 'Music', 'Philosophy']);

  private chatService = inject(ChatService);
  private router = inject(Router);
  private _snackbar = inject(MatSnackBar);
  private wsService = inject(WebsocketService);
  private authService = inject(AuthService);

  currentUserId = signal<string | undefined>(undefined);

  chatRooms!: ChatRooms;
  notifications!: Notification[];

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

    this.wsService.listenChatRoomLeft().subscribe((chat) => {
      this.chatRooms = {
        ...this.chatRooms,
        userRooms: this.chatRooms.userRooms.filter((c) => c._id !== chat._id),
      };
    });

    this.wsService.listenNotifications().subscribe((notification) => {
      this.notifications.unshift(notification);
    });
  }

  friends = [
    { name: 'Alice', status: 'online' },
    { name: 'Bob', status: 'typing...' },
  ];

  filteredRooms = computed(() =>
    this.rooms().filter((r) =>
      r.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );

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
}
