import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [RouterModule, FormsModule],
  standalone: true,
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  searchTerm = signal('');
  rooms = signal(['General', 'Gaming', 'Music', 'Philosophy']);

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
}
