import {
  afterNextRender,
  Component,
  inject,
  Inject,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PopulatedUser } from '../../shared/models/populated-user.model';
import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';

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
    MatSelectModule,
  ],
  standalone: true,
  templateUrl: './user-card-dialog.component.html',
  styleUrl: './user-card-dialog.component.scss',
})
export class UserCardDialogComponent implements OnChanges {
  isAdmin: boolean = false;
  isOwner: boolean = false;
  isModerator: boolean = false;
  canEditRoles: boolean = false;
  editRolesMode: boolean = false;
  selectedRoleToAdd: string | null = null;
  availableRoles: ChatRoomRole[] = [];
  chatRoomRoles: ChatRoomRole[] = [];
  // readonly allRoles = ['Owner', 'Admin', 'Moderator'];

  private wsService = inject(WebsocketService);
  private _snackbar = inject(MatSnackBar);

  editStatusMode = false;
  updatedStatus!: string;
  environment = environment;

  roleRanks: Record<string, number> = {
    Owner: 3,
    Admin: 2,
    Moderator: 1,
  };

  canEditRole(assignerRoles: string[], targetRole: string): boolean {
    const targetRank = this.roleRanks[targetRole] ?? 0;
    const highestAssignerRank = Math.max(
      ...assignerRoles.map((r) => this.roleRanks[r] ?? 0)
    );

    if (
      targetRank <= highestAssignerRank &&
      (targetRole === 'Banned' || targetRole === 'Muted')
    ) {
      return false;
    }

    return targetRank <= highestAssignerRank;
  }

  constructor(
    private dialogRef: MatDialogRef<UserCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      selectedUser: PopulatedUser;
      currentUserId: string;
      chatId: string;
      isAdmin: boolean;
      isOwner: boolean;
      isModerator: boolean;
      chatRoomRoles: ChatRoomRole[];
    }
  ) {
    this.updatedStatus = this.data.selectedUser.user.status;
    this.isAdmin = this.data.isAdmin;
    this.isOwner = this.data.isOwner;
    this.isModerator = this.data.isModerator;
    this.canEditRoles = this.isAdmin || this.isOwner || this.isModerator;

    if (this.data.selectedUser.user._id === this.data.currentUserId) {
      this.availableRoles = this.availableRoles.filter(
        (role) => role.name !== 'Banned' && role.name !== 'Muted'
      );
    }

    this.availableRoles = this.data.chatRoomRoles.filter(
      (role) =>
        role.name !== 'Owner' &&
        this.canEditRole(this.data.selectedUser.roles, role.name)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatRoomRoles']) {
      console.log('Received chatRoomRoles:', this.chatRoomRoles);
    }
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

  addRole() {
    if (!this.selectedRoleToAdd) return;

    this.wsService.emit(
      'assignRole',
      {
        userId: this.data.selectedUser.user._id,
        chatId: this.data.chatId,
        role: this.selectedRoleToAdd,
      },
      (res: any) => {
        if (res?.error) {
          this._snackbar.open(res.error, 'Close', { duration: 3000 });
        } else {
          this._snackbar.open('Role added!', 'Close', { duration: 2000 });
          this.selectedRoleToAdd = null;
        }
      }
    );
  }

  trimText(text: string, max: number): string {
    if (!text) return '';
    const trimmed = text.slice(0, max).trim();
    if (trimmed.length === text.length) return trimmed;
    return trimmed.replace(/\.+$/, '') + '...';
  }
}
