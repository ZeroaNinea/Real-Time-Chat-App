import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-chat-room-settings-dialog',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  standalone: true,
  templateUrl: './chat-room-settings-dialog.component.html',
  styleUrl: './chat-room-settings-dialog.component.scss',
})
export class ChatRoomSettingsDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ChatRoomSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      name: string;
      preview: string;
      topic: string;
    }
  ) {}

  onCancel() {
    this.dialogRef.close(null);
  }

  onSave() {
    this.dialogRef.close(this.data);
  }
}
