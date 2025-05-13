import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RenameChannelDialogComponent } from '../rename-channel-dialog/rename-channel-dialog.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete-channel-dialog',
  imports: [MatDialogModule, MatButtonModule],
  standalone: true,
  templateUrl: './delete-channel-dialog.component.html',
  styleUrl: './delete-channel-dialog.component.scss',
})
export class DeleteChannelDialogComponent {
  delete: boolean = false;

  constructor(private dialogRef: MatDialogRef<RenameChannelDialogComponent>) {}

  onCancel() {
    this.dialogRef.close(null);
  }

  onDelete() {
    this.dialogRef.close((this.delete = true));
  }
}
