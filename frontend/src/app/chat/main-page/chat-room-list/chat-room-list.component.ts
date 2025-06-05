import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

import { ChatRooms } from '../../shared/models/chat-rooms.interface';
import { Chat } from '../../shared/models/chat.model';

@Component({
  selector: 'app-chat-room-list',
  imports: [MatCardModule, MatListModule],
  standalone: true,
  templateUrl: './chat-room-list.component.html',
  styleUrl: './chat-room-list.component.scss',
})
export class ChatRoomListComponent implements OnChanges {
  @Input() chatRooms!: ChatRooms;

  @Output() joinRoom = new EventEmitter<Chat>();

  private router = inject(Router);

  allRooms: Chat[] = [];
  userRooms: Chat[] = [];

  ngOnChanges() {
    if (!this.chatRooms) return;

    this.allRooms = this.chatRooms.allRooms;
    this.userRooms = this.chatRooms.userRooms;

    console.log(this.allRooms);
    console.log(this.userRooms);
  }

  createRoom() {
    this.router.navigate(['/chat-room']);
  }
}
