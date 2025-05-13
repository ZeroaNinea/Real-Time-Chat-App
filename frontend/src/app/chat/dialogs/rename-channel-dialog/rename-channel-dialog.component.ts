import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-rename-channel-dialog',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule],
  standalone: true,
  templateUrl: './rename-channel-dialog.component.html',
  styleUrl: './rename-channel-dialog.component.scss',
})
export class RenameChannelDialogComponent {
  newName: string;

  constructor(
    private dialogRef: MatDialogRef<RenameChannelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentName: string }
  ) {
    this.newName = data.currentName;
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  onSave() {
    this.dialogRef.close(this.newName.trim());
  }
}
