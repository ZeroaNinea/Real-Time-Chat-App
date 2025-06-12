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
  @Input() chatThumbnail: File | null = null;
  @Input() chatThumbnailUrl: string | null = '';
  @Input() chatTopic = '';
  @Input() newChannel = '';
  @Input() channels: Channel[] = [];
  // @Input() channels: string[] = [];
  @Input() isAdmin = false;
  @Input() isOwner = false;
  @Input() chatId: string | null = null;

  @Output() chatNameChange = new EventEmitter<string>();
  @Output() chatTopicChange = new EventEmitter<string>();
  @Output() chatThumbnailChange = new EventEmitter<File>();
  @Output() newChannelChange = new EventEmitter<string>();
  @Output() addChannel = new EventEmitter<void>();
  @Output() saveChanges = new EventEmitter<File>();
  @Output() deleteRoom = new EventEmitter<void>();
  // @Output() onChannelEdit = new EventEmitter<string>();
  @Output() onChannelEdit = new EventEmitter<{
    channelId: string;
    key: keyof Channel;
    value: any;
  }>();
  @Output() settingsChanged = new EventEmitter<{
    name: string;
    topic: string;
    file: File | null;
  }>();

  private dialog = inject(MatDialog);
  private chatService = inject(ChatService);

  environment = environment;

  getChatThumbnailUrl() {
    if (this.chatThumbnailUrl) {
      return `${this.environment.backendUrl}/uploads/chat-thumbnails/${this.chatThumbnailUrl}`;
    } else {
      return 'assets/camera.svg';
    }
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
        topic: this.chatTopic,
        thumbnail: this.chatThumbnail,
        chatId: this.chatId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.chatNameChange.emit(result.name);
        this.chatTopicChange.emit(result.topic);
        this.chatThumbnailChange.emit(result.file);
        this.chatName = result.name;
        this.chatTopic = result.topic;
        this.chatThumbnail = result.thumbnail;

        const file = result.file as File | null;
        this.saveChanges.emit(file!);
        this.settingsChanged.emit(result);
      }
    });
  }
}
