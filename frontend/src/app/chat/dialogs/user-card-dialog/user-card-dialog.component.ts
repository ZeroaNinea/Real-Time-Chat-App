import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-user-card-dialog',
  imports: [],
  standalone: true,
  templateUrl: './user-card-dialog.component.html',
  styleUrl: './user-card-dialog.component.scss',
})
export class UserCardDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<UserCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {}
  ) {}
}
