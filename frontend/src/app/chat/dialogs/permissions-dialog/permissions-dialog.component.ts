import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-permissions-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
  ],
  standalone: true,
  templateUrl: './permissions-dialog.component.html',
  styleUrl: './permissions-dialog.component.scss',
})
export class PermissionsDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<PermissionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      channelId: string;
      currentPermissions: {
        adminsOnly?: boolean;
        readOnly?: boolean;
        allowedUsers?: string[];
        allowedRoles?: string[];
      };
    }
  ) {}

  onSave() {
    console.log('Saving updated permissions...');
    // this.dialogRef.close(this.updatedPermissionsForm.value);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
