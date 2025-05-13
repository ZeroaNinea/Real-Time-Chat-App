import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-delete-channel-dialog',
  imports: [MatDialogModule, MatButtonModule],
  standalone: true,
  templateUrl: './delete-channel-dialog.component.html',
  styleUrl: './delete-channel-dialog.component.scss',
})
export class DeleteChannelDialogComponent {
  isChatRoom!: boolean;
  isDelete!: boolean;

  constructor(
    private dialogRef: MatDialogRef<DeleteChannelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isDelete: boolean }
  ) {}

  onCancel() {
    this.dialogRef.close((this.isDelete = false));
  }

  onDelete() {
    this.dialogRef.close((this.isDelete = true));
  }
}
