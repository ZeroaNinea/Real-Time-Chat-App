import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Channel } from '../shared/models/channel.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-channel-list',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss',
})
export class ChannelListComponent {
  @Input() isAdmin = false;
  @Input() isOwner = false;
  @Input() channels: Channel[] = [];
  @Input() chatId: string | null = null;

  @Output() removeChannel = new EventEmitter<string>();
  @Output() renameChannel = new EventEmitter<{ id: string; newName: string }>();

  @Output() addChannel = new EventEmitter<void>();

  onRemove(id: string) {
    this.removeChannel.emit(id);
  }

  onRename(id: string, newName: string) {
    this.renameChannel.emit({ id, newName });
  }

  prompt(notification: string, channelName: string) {
    return prompt(notification, channelName);
  }
}
