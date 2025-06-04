import {
  afterNextRender,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ChatService } from '../../shared/services/chat-service/chat.service';
import { ChatRooms } from '../../shared/models/chat-rooms.interface';
import { ChatRoomListComponent } from '../chat-room-list/chat-room-list.component';

@Component({
  selector: 'app-main',
  imports: [RouterModule, FormsModule, ChatRoomListComponent],
  standalone: true,
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  searchTerm = signal('');
  rooms = signal(['General', 'Gaming', 'Music', 'Philosophy']);

  private router = inject(Router);
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

  enterRoom(room: string) {
    // For now, just navigate to the chat-room page.
    // Later you can pass the room name or ID via query params or a service.
    console.log('Entering room:', room);
  }

  createRoom() {
    this.router.navigate(['/chat-room']);
  }
}
