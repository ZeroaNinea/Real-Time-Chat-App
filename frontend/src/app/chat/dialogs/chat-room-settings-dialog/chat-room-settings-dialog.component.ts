import { Component, inject, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';

import { ChatService } from '../../shared/services/chat-service/chat.service';

@Component({
  selector: 'app-chat-room-settings-dialog',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRippleModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './chat-room-settings-dialog.component.html',
  styleUrl: './chat-room-settings-dialog.component.scss',
})
export class ChatRoomSettingsDialogComponent {
  name = '';
  topic = '';

  thumbnailPreview: string | null = null;
  selectedFile: File | null = null;
  chatService = inject(ChatService);

  constructor(
    private dialogRef: MatDialogRef<ChatRoomSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      name: string;
      topic: string;
      thumbnail: File | null;
      thumbnailUrl: string | null;
      chatId: string | null;
    }
  ) {
    // if (data.thumbnailUrl) {
    // this.thumbnailPreview = data.thumbnailUrl;
    // }

    this.name = data.name;
    this.topic = data.topic;
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  onSave() {
    this.dialogRef.close({
      name: this.name,
      topic: this.topic,
      file: this.selectedFile,
      thumbnail: this.thumbnailPreview,
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.thumbnailPreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onDeleteThumbnail() {
    if (!this.data.chatId) return;

    this.chatService.deleteThumbnail(this.data.chatId).subscribe({
      next: () => {
        this.thumbnailPreview = null;
        this.selectedFile = null;
        this.data.thumbnail = null;
      },
      error: (err) => {
        console.error('Failed to delete thumbnail', err);
      },
    });
  }
}
