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
  thumbnailPreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private dialogRef: MatDialogRef<ChatRoomSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      name: string;
      topic: string;
      thumbnail: string;
    }
  ) {}

  onCancel() {
    this.dialogRef.close(null);
  }

  onSave() {
    this.dialogRef.close({
      name: this.data.name,
      topic: this.data.topic,
      file: this.selectedFile,
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
}
