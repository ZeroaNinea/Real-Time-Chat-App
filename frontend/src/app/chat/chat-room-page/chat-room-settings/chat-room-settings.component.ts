import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-room-settings',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './chat-room-settings.component.html',
  styleUrl: './chat-room-settings.component.scss',
})
export class ChatRoomSettingsComponent {
  @Input() chatName = '';
  @Input() newChannel = '';
  @Input() channels: string[] = [];
  @Input() isAdmin = false;
  @Input() isOwner = false;
  @Input() chatId: string | null = null;

  @Output() chatNameChange = new EventEmitter<string>();
  @Output() newChannelChange = new EventEmitter<string>();
  @Output() addChannel = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();
  @Output() deleteRoom = new EventEmitter<void>();
}
