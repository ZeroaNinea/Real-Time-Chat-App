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

import { environment } from '../../../../environments/environment';

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
  @Input() currentUserId: string | undefined;

  @Output() joinRoom = new EventEmitter<Chat>();
  @Output() leaveRoom = new EventEmitter<Chat>();
  @Output() visitRoom = new EventEmitter<Chat>();

  allRooms: Chat[] = [];
  userRooms: Chat[] = [];

  environment = environment;

  ngOnChanges() {
    if (!this.chatRooms) return;

    this.allRooms = this.chatRooms.allRooms;
    this.userRooms = this.chatRooms.userRooms;
  }

  filteredChatRooms(): Chat[] {
    return this.allRooms.filter((room) =>
      room.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  isJoinDisabled(room: Chat): boolean {
    const user = room.members.find(
      (m) => m.user.toString() === this.currentUserId
    );

    if (this.userRooms.some((r) => r._id === room._id)) {
      return true;
    }

    if (!user) {
      return false;
    }

    if (user.roles.includes('Banned')) {
      return true;
    }

    return false;
  }

  isLeaveDisabled(room: Chat): boolean {
    const user = room.members.find(
      (m) => m.user.toString() === this.currentUserId
    );

    if (user?.roles.includes('Owner')) {
      return true;
    } else {
      return false;
    }
  }

  getChatThumbnailUrl(room: Chat) {
    if (room.thumbnail) {
      return `${this.environment.backendUrl}/uploads/chat-thumbnails/${room.thumbnail}`;
    } else {
      return 'assets/camera.svg';
    }
  }

  isNotEmpty(arr: Chat[]) {
    return arr?.length !== 0;
  }
}
