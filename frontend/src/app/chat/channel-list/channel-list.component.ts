import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Channel } from '../shared/models/channel.model';

@Component({
  selector: 'app-channel-list',
  imports: [],
  standalone: true,
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss',
})
export class ChannelListComponent {
  @Input() channels: Channel[] = [];

  @Output() removeChannel = new EventEmitter<string>();
  @Output() renameChannel = new EventEmitter<{ id: string; newName: string }>();

  onRemove(id: string) {
    this.removeChannel.emit(id);
  }

  onRename(id: string, newName: string) {
    this.renameChannel.emit({ id, newName });
  }
}
