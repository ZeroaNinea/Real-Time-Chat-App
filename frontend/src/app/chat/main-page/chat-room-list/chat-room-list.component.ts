import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

import { ChatRooms } from '../../shared/models/chat-rooms.interface';
import { Chat } from '../../shared/models/chat.model';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-chat-room-list',
  imports: [MatCardModule, MatListModule, MatButtonModule, MatTabsModule],
  standalone: true,
  templateUrl: './chat-room-list.component.html',
  styleUrl: './chat-room-list.component.scss',
})
export class ChatRoomListComponent implements OnChanges {
  @Input() chatRooms!: ChatRooms;
  @Input() searchTerm = '';

  @Output() joinRoom = new EventEmitter<Chat>();
  @Output() leaveRoom = new EventEmitter<Chat>();
  @Output() visitRoom = new EventEmitter<Chat>();

  allRooms: Chat[] = [];
  userRooms: Chat[] = [];

  ngOnChanges() {
    if (!this.chatRooms) return;

    this.allRooms = this.chatRooms.allRooms;
    this.userRooms = this.chatRooms.userRooms;

    console.log(this.allRooms);
    console.log(this.userRooms);
  }

  filteredChatRooms(): Chat[] {
    return this.allRooms.filter((room) =>
      room.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  isJoinDisabled(room: Chat): boolean {
    const user = room.members.find(
      (m) => m.user.toString() === localStorage.getItem('userId')
    );

    if (this.userRooms.some((r) => r._id === room._id)) {
      console.log('Already in this room');
      return true;
    }

    if (!user) {
      console.log('User not in this room');
      return false;
    }

    if (user.roles.includes('Banned')) {
      console.log('User is banned from this room');
      return true;
    }

    return false;
  }
}
