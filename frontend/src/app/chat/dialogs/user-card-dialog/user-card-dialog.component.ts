import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { PopulatedUser } from '../../shared/models/populated-user.model';

@Component({
  selector: 'app-user-card-dialog',
  imports: [MatCardModule, MatChipsModule],
  standalone: true,
  templateUrl: './user-card-dialog.component.html',
  styleUrl: './user-card-dialog.component.scss',
})
export class UserCardDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<UserCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: PopulatedUser
  ) {}
}
