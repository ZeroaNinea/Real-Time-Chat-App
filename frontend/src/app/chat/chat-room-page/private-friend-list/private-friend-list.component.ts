import { Component, Input } from '@angular/core';
import { PrivateChatRoom } from '../../shared/models/private-chat-room.model';

@Component({
  selector: 'app-private-friend-list',
  imports: [],
  standalone: true,
  templateUrl: './private-friend-list.component.html',
  styleUrl: './private-friend-list.component.scss',
})
export class PrivateFriendListComponent {
  @Input() privateChatRooms: PrivateChatRoom[] = [];
}
