import {
  afterNextRender,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { Channel } from '../shared/models/channel.model';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { WebsocketService } from '../shared/services/websocket/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-channel-list',
  imports: [RouterLink, MatButtonModule],
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

  @Output() addChannel = new EventEmitter<string>();

  onRemove(id: string) {
    this.removeChannel.emit(id);
  }

  onRename(id: string, newName: string) {
    this.renameChannel.emit({ id, newName });
  }

  prompt(notification: string, channelName: string) {
    return prompt(notification, channelName);
  }

  addNewChannel() {
    const name = prompt('Channel name:');
    console.log('New channel:', name);
    if (name) {
      this.addChannel.emit(name);
    }
  }
}
