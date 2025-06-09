import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-chat-room-settings-dialog',
  imports: [],
  standalone: true,
  templateUrl: './chat-room-settings-dialog.component.html',
  styleUrl: './chat-room-settings-dialog.component.scss',
})
export class ChatRoomSettingsDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ChatRoomSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {}
  ) {}
}
