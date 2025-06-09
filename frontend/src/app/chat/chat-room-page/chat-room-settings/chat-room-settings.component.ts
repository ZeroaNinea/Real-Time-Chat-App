import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Channel } from '../../shared/models/channel.model';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';

import { ChatService } from '../../shared/services/chat-service/chat.service';
import { ChatRoomSettingsDialogComponent } from '../../dialogs/chat-room-settings-dialog/chat-room-settings-dialog.component';
import { environment } from '../../../../environments/environment';

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
  @Input() chatThumbnail = '';
  @Input() chatTopic = '';
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

  private dialog = inject(MatDialog);
  private chatService = inject(ChatService);

  environment = environment;

  getChatThumbnailUrl() {
    return this.chatThumbnail
      ? `${this.environment.backendUrl}/${this.chatThumbnail}`
      : 'assets/camera.svg';
  }

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

  openSettingsDialog() {
    const dialogRef = this.dialog.open(ChatRoomSettingsDialogComponent, {
      data: {
        name: this.chatName,
        preview: this.chatThumbnail,
        topic: this.chatTopic,
      },
    });

    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     this.chatService
    //       .updateChatRoom(this.chatId!, result)
    //       .subscribe(() => this.fetchChatRoom(this.chatId!));
    //   }
    // });
  }
}
