import {
  Component,
  inject,
  Inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
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
import { ChatService } from '../../shared/services/chat-service/chat.service';

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
export class UserCardDialogComponent {
  isAdmin: boolean = false;
  isOwner: boolean = false;
  isModerator: boolean = false;
  canEditRoles: boolean = false;
  editRolesMode: boolean = false;
  selectedRoleToAdd: string | null = null;
  availableRoles: ChatRoomRole[] = [];
  chatRoomRoles: ChatRoomRole[] = [];

  private wsService = inject(WebsocketService);
  private chatService = inject(ChatService);
  private _snackbar = inject(MatSnackBar);
  private router = inject(Router);

  editStatusMode = false;
  updatedStatus!: string;
  environment = environment;
  isChecked: boolean = false;

  roleRanks: Record<string, number> = {
    Owner: 3,
    Admin: 2,
    Moderator: 1,
  };

  allPermissions = [
    'canBan',
    'canMute',
    'canDeleteMessages',
    'canCreateChannels',
    'canEditChannels',
    'canDeleteChannels',
    'canDeleteChatroom',
    'canAssignRoles',
    'canAssignAdmins',
    'canAssignModerators',
  ];
  PERMISSION_RANKS: Record<string, number> = {
    canBan: 1,
    canMute: 1,
    canDeleteMessages: 1,
    canCreateChannels: 2,
    canEditChannels: 2,
    canDeleteChannels: 3,
    canAssignRoles: 4,
    canAssignModerators: 5,
    canAssignAdmins: 6,
    canDeleteChatroom: 7,
  };

  canEditRole(assignerRoles: string[], targetRole: string): boolean {
    if (targetRole === 'Owner') return false;

    const targetRank = this.roleRanks[targetRole] ?? 0;

    const highestAssignerRank = Math.max(
      ...assignerRoles.map((r) => this.roleRanks[r] ?? 0)
    );

    if (
      targetRank < highestAssignerRank &&
      (targetRole === 'Banned' || targetRole === 'Muted')
    ) {
      return false;
    }

    return targetRank < highestAssignerRank;
  }

  getMaxPermissionRank(permissions: string[]): number {
    return Math.max(...permissions.map((p) => this.PERMISSION_RANKS[p] || 0));
  }

  canAssignPermissionsBelowOwnLevel(
    assignerPermissions: string[],
    targetPermissions: string[]
  ): boolean {
    const assignerMax = this.getMaxPermissionRank(assignerPermissions);
    const targetMax = this.getMaxPermissionRank(targetPermissions);

    return targetMax < assignerMax;
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
      currentUserRoles: string[];
      currentUserFriends: string[];
      currentUserBanList: string[];
      currentUserPendingRequests: string[];
    }
  ) {
    this.updatedStatus = this.data.selectedUser.user.status;
    this.isAdmin = this.data.isAdmin;
    this.isOwner = this.data.isOwner;
    this.isModerator = this.data.isModerator;
    this.canEditRoles = this.isAdmin || this.isOwner || this.isModerator;

    this.availableRoles = this.data.chatRoomRoles.filter((role) => {
      if (
        !this.currentUserRoles.includes('Owner') ||
        !this.currentUserRoles.includes('Admin') ||
        !this.currentUserRoles.includes('Moderator')
      ) {
        this.canAssignPermissionsBelowOwnLevel(
          this.currentUserPermissions,
          role.permissions
        );
      } else {
        this.canEditRole(this.data.currentUserRoles, role.name);
      }
    });
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['chatRoomRoles']) {
  //     console.log('Received chatRoomRoles:', this.chatRoomRoles);
  //   }
  // }

  get currentUserRoles(): string[] {
    return this.data.currentUserRoles;
  }

  get currentUserPermissions(): string[] {
    return this.currentUserRoles.flatMap((roleName) => {
      return (
        this.data.chatRoomRoles.find((r: ChatRoomRole) => r.name === roleName)
          ?.permissions || []
      );
    });
  }

  getRolePermissions(role: string): string[] {
    return (
      this.data.chatRoomRoles.find((r: ChatRoomRole) => r.name === role)
        ?.permissions || []
    );
  }

  get isOwnProfile(): boolean {
    return this.data.selectedUser.user._id === this.data.currentUserId;
  }

  saveStatus(): void {
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

  removeRole(role: string) {
    console.log('Removing role:', role);
    this.wsService.emit(
      'removeRole',
      {
        userId: this.data.selectedUser.user._id,
        chatId: this.data.chatId,
        role,
      },
      (res: any) => {
        if (res?.error) {
          this._snackbar.open(res.error, 'Close', { duration: 3000 });
        } else {
          this._snackbar.open('Role removed!', 'Close', { duration: 2000 });
        }
      }
    );
  }

  transferOwnership() {
    this.wsService.emit(
      'transferOwnership',
      {
        userId: this.data.selectedUser.user._id,
        chatId: this.data.chatId,
      },
      (res: any) => {
        if (res?.error) {
          this._snackbar.open(res.error, 'Close', { duration: 3000 });
        } else {
          this._snackbar.open(
            `Ownership transferred to ${this.data.selectedUser.user.username}!`,
            'Close',
            {
              duration: 2000,
            }
          );
        }
      }
    );
  }

  sendFriendRequest() {
    this.wsService.emit(
      'sendFriendRequest',
      {
        receiverId: this.data.selectedUser.user._id,
      },
      (res: any) => {
        if (res?.error) {
          this._snackbar.open(res.error, 'Close', { duration: 3000 });
        } else {
          this.data.currentUserPendingRequests.push(
            this.data.selectedUser.user._id
          );

          this._snackbar.open(
            `Friend request sent to ${this.data.selectedUser.user.username}!`,
            'Close',
            {
              duration: 2000,
            }
          );
        }
      }
    );
  }

  isFriend() {
    return this.data.selectedUser.user.friends.includes(
      this.data.currentUserId
    );
  }

  isBanned() {
    return this.data.currentUserBanList.includes(
      this.data.selectedUser.user._id
    );
  }

  isRequestPending() {
    return this.data.currentUserPendingRequests.includes(
      this.data.selectedUser.user._id
    );
  }

  copyUserId(): void {
    const id = this.data.selectedUser.user._id;
    this.isChecked = true;

    navigator.clipboard
      .writeText(id)
      .then(() => {
        this._snackbar.open('User ID copied to clipboard!', 'Close', {
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error('Failed to copy user ID', err);
        this._snackbar.open('Failed to copy ID', 'Close', { duration: 2000 });
      });

    setTimeout(() => {
      this.isChecked = false;
    }, 2000);
  }

  banUser(user: PopulatedUser) {
    this.wsService.emit('banUser', user.user._id, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to ban user',
          'Close',
          { duration: 3000 }
        );
      } else {
        this.data.currentUserBanList.push(user.user._id);
        this.data.currentUserFriends = this.data.currentUserFriends.filter(
          (friend) => friend !== user.user._id
        );

        this._snackbar.open('Banned user!', 'Close', { duration: 2000 });
      }
    });
  }

  unbanUser(user: PopulatedUser) {
    this.wsService.emit('unbanUser', user.user._id, (res) => {
      if (res?.error) {
        this._snackbar.open(
          res.error.message || 'Failed to unban user',
          'Close',
          { duration: 3000 }
        );
      } else {
        this.data.currentUserBanList = this.data.currentUserBanList.filter(
          (id) => id !== user.user._id
        );

        this._snackbar.open('Unbanned user!', 'Close', { duration: 2000 });
      }
    });
  }

  pM(targetUserId: string) {
    this.chatService.getOrCreatePrivateChat(targetUserId).subscribe((res) => {
      this.router.navigate(['/chat-room', res._id]);
    });
  }

  trimText(text: string, max: number): string {
    if (!text) return '';
    const trimmed = text.slice(0, max).trim();
    if (trimmed.length === text.length) return trimmed;
    return trimmed.replace(/\.+$/, '') + '...';
  }
}
