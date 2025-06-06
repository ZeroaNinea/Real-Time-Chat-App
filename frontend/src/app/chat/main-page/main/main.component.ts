import {
  afterNextRender,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { ChatService } from '../../shared/services/chat-service/chat.service';
import { ChatRooms } from '../../shared/models/chat-rooms.interface';
import { Chat } from '../../shared/models/chat.model';

import { ChatRoomListComponent } from '../chat-room-list/chat-room-list.component';
import { HeaderComponent } from '../header/header.component';
import { FriendListComponent } from '../friend-list/friend-list.component';

@Component({
  selector: 'app-main',
  imports: [
    RouterModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ChatRoomListComponent,
    HeaderComponent,
    FriendListComponent,
  ],
  standalone: true,
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  searchTerm = signal('');
  rooms = signal(['General', 'Gaming', 'Music', 'Philosophy']);

  private chatService = inject(ChatService);

  chatRooms!: ChatRooms;

  constructor() {
    afterNextRender(() => {
      this.chatService.getChatRooms(1, 20).subscribe((rooms) => {
        this.chatRooms = rooms;
      });
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
    // For now, just navigate to the chat-room page.
    // Later you can pass the room name or ID via query params or a service.
    console.log('Joining room:', room);
  }
}
