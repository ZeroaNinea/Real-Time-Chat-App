import { Component, Input } from '@angular/core';
import { ChatRooms } from '../../shared/models/chat-rooms.interface';

@Component({
  selector: 'app-chat-room-list',
  imports: [],
  standalone: true,
  templateUrl: './chat-room-list.component.html',
  styleUrl: './chat-room-list.component.scss',
})
export class ChatRoomListComponent {
  @Input() chatRooms!: ChatRooms;
}
