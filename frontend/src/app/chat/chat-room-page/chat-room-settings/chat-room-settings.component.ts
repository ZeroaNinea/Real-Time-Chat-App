import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Channel } from '../../shared/models/channel.model';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-chat-room-settings',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
  ],
  standalone: true,
  templateUrl: './chat-room-settings.component.html',
  styleUrl: './chat-room-settings.component.scss',
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic',
      },
    },
  ],
})
export class ChatRoomSettingsComponent {
  @Input() chatName = '';
  @Input() newChannel = '';
  @Input() channels: Channel[] = [];
  // @Input() channels: string[] = [];
  @Input() isAdmin = false;
  @Input() isOwner = false;
  @Input() chatId: string | null = null;

  @Output() chatNameChange = new EventEmitter<string>();
  @Output() newChannelChange = new EventEmitter<string>();
  @Output() addChannel = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<void>();
  @Output() deleteRoom = new EventEmitter<void>();
  // @Output() onChannelEdit = new EventEmitter<string>();
  @Output() onChannelEdit = new EventEmitter<{
    channelId: string;
    key: keyof Channel;
    value: any;
  }>();

  handleAdminsOnlyChange(channel: Channel, event: Event) {
    const input = event.target as HTMLInputElement;
    this.onChannelEdit.emit({
      channelId: channel._id,
      key: 'permissions',
      value: {
        ...channel.permissions,
        adminsOnly: input.checked,
      },
    });
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
