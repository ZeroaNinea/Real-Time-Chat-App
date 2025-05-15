import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

import {
  ChannelPermissions,
  ChannelPermissionsString,
} from '../../shared/models/permissions.aliase';

@Component({
  selector: 'app-permissions-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
  ],
  templateUrl: './permissions-dialog.component.html',
  styleUrl: './permissions-dialog.component.scss',
})
export class PermissionsDialogComponent {
  updatedPermissions: ChannelPermissionsString;

  constructor(
    private dialogRef: MatDialogRef<PermissionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      channelId: string;
      currentPermissions: ChannelPermissions;
    }
  ) {
    this.updatedPermissions = {
      adminsOnly: this.data.currentPermissions.adminsOnly ?? false,
      readOnly: this.data.currentPermissions.readOnly ?? false,
      allowedUsers: (this.data.currentPermissions.allowedUsers || []).join(
        ', '
      ),
      allowedRoles: (this.data.currentPermissions.allowedRoles || []).join(
        ', '
      ),
    };
  }

  onSave() {
    const changes: any = {};
    const current = this.data.currentPermissions;

    if (this.updatedPermissions.adminsOnly !== current.adminsOnly) {
      changes.adminsOnly = this.updatedPermissions.adminsOnly;
    }
    if (this.updatedPermissions.readOnly !== current.readOnly) {
      changes.readOnly = this.updatedPermissions.readOnly;
    }

    const parsedUsers = this.updatedPermissions.allowedUsers
      ?.split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    const parsedRoles = this.updatedPermissions.allowedRoles
      ?.split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (
      JSON.stringify(parsedUsers) !== JSON.stringify(current.allowedUsers || [])
    ) {
      changes.allowedUsers = parsedUsers;
    }

    if (
      JSON.stringify(parsedRoles) !== JSON.stringify(current.allowedRoles || [])
    ) {
      changes.allowedRoles = parsedRoles;
    }

    this.dialogRef.close(changes);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
