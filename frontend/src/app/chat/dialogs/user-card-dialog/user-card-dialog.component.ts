import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';
import { WebsocketService } from '../../shared/services/websocket/websocket.service';

@Component({
  selector: 'app-user-card-dialog',
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  standalone: true,
  templateUrl: './user-card-dialog.component.html',
  styleUrl: './user-card-dialog.component.scss',
})
export class UserCardDialogComponent {
  private wsService = inject(WebsocketService);
  private _snackbar = inject(MatSnackBar);

  editStatusMode = false;
  updatedStatus!: string;
  environment = environment;

  constructor(
    private dialogRef: MatDialogRef<UserCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      selectedUser: PopulatedUser;
      currentUserId: string;
      isAdmin: boolean;
      isOwner: boolean;
      isModerator: boolean;
    }
  ) {
    this.updatedStatus = this.data.selectedUser.user.status;
  }

  get isOwnProfile(): boolean {
    return this.data.selectedUser.user._id === this.data.currentUserId;
  }

  saveStatus(): void {
    console.log('Saving status...');
    this.wsService.emit('editStatus', { status: this.updatedStatus }, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to reply message',
          'Close',
          { duration: 3000 }
        );
      }
    });

    this.editStatusMode = false;
  }

  getAvatarUrl(): string {
    const avatar = this.data.selectedUser.user.avatar;
    return avatar
      ? `${this.environment.backendUrl}/${avatar}`
      : 'assets/camera.svg';
  }

  trimText(text: string, max: number): string {
    if (!text) return '';
    const trimmed = text.slice(0, max).trim();
    if (trimmed.length === text.length) return trimmed;
    return trimmed.replace(/\.+$/, '') + '...';
  }
}
