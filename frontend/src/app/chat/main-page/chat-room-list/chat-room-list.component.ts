import { Component, inject, Input, OnChanges } from '@angular/core';
import { Router } from '@angular/router';

import { ChatRooms } from '../../shared/models/chat-rooms.interface';
import { Chat } from '../../shared/models/chat.model';

@Component({
  selector: 'app-chat-room-list',
  imports: [],
  standalone: true,
  templateUrl: './chat-room-list.component.html',
  styleUrl: './chat-room-list.component.scss',
})
export class ChatRoomListComponent implements OnChanges {
  @Input() chatRooms!: ChatRooms;

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
