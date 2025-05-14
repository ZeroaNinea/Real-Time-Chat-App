import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Channel } from '../shared/models/channel.model';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-channel-list',
  imports: [RouterLink, MatButtonModule, MatIconModule],
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
  @Output() renameChannel = new EventEmitter<{ id: string; name: string }>();

  @Output() addChannel = new EventEmitter<string>();

  onRemove(id: string) {
    this.removeChannel.emit(id);
  }

  onRenameClick(channel: { _id: string; name: string }) {
    this.renameChannel.emit({ id: channel._id, name: channel.name });
  }

  prompt(notification: string, channelName: string) {
    return prompt(notification, channelName);
  }

  addNewChannel() {
    this.addChannel.emit();
  }
}
