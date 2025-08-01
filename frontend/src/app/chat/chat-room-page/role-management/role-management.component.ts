import { Component, inject, Input } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { WebsocketService } from '../../shared/services/websocket/websocket.service';

@Component({
  selector: 'app-role-management',
  imports: [
    MatFormFieldModule,
    MatListModule,
    MatSelectModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatChipsModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss',
})
export class RoleManagementComponent {
  private wsService = inject(WebsocketService);
  private _snackbar = inject(MatSnackBar);

  @Input() chatId!: string | null;
  @Input() roles: ChatRoomRole[] = [];
  @Input() members: PopulatedUser[] = [];
  @Input() currentUserId!: string | undefined;
  @Input() isAdmin = false;
  @Input() isOwner = false;
  @Input() isModerator = false;

  role: Partial<ChatRoomRole> = {};
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

  isEditing = false;
  editingRole: ChatRoomRole | null = null;

  get currentUserRoles(): string[] {
    return (
      this.members.find((m) => m.user._id === this.currentUserId)?.roles || []
    );
  }

  get currentUserPermissions(): string[] {
    return this.currentUserRoles.flatMap((roleName) => {
      return this.roles.find((r) => r.name === roleName)?.permissions || [];
    });
  }

  canSelfAssign(role: ChatRoomRole): boolean {
    if (!role.canBeSelfAssigned) return false;

    if (
      role.allowedUserIds?.length &&
      !role.allowedUserIds.includes(
        this.currentUserId ? this.currentUserId : ''
      )
    ) {
      return false;
    }

    if (
      role.allowedRoles?.length &&
      !role.allowedRoles.some((r: string) => this.currentUserRoles.includes(r))
    ) {
      return false;
    }

    return true;
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

  cancel() {
    this.resetForm();
    this.editingRole = null;
  }

  editRole(role: ChatRoomRole) {
    console.log('Edit role', role.name);
    this.role = { ...role };
    this.isEditing = true;
    this.editingRole = role;
  }

  resetForm() {
    this.role = {};
    this.isEditing = false;
  }

  saveRole() {
    const event = this.isEditing ? 'editRole' : 'createRole';

    this.wsService.emit(
      event,
      {
        chatId: this.chatId,
        role: this.role,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(res.error || 'Failed to create role', 'Close', {
            duration: 3000,
          });
        } else {
          this._snackbar.open('Role saved!', 'Close', { duration: 2000 });
          this.resetForm();
        }
      }
    );
  }

  deleteRole(role: ChatRoomRole) {
    this.wsService.emit(
      'deleteRole',
      {
        chatId: this.chatId,
        role: role,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(res.error || 'Failed to delete role', 'Close', {
            duration: 3000,
          });
        } else {
          this._snackbar.open('Role deleted!', 'Close', { duration: 2000 });
        }
      }
    );
  }

  onSelectionChange(event: MatSelectionListChange) {
    const changedOption = event.options[0];
    const roleName = changedOption.value;
    const selected = changedOption.selected;
    console.log('Toggle role', roleName, selected);

    this.wsService.emit(
      'toggleRole',
      {
        chatId: this.chatId,
        roleName,
        selected,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(res.error || 'Failed to toggle role', 'Close', {
            duration: 3000,
          });
        } else {
          this._snackbar.open('Role toggled!', 'Close', { duration: 2000 });
        }
      }
    );
  }
}
