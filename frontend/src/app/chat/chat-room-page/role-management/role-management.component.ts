import { Component, inject, Input } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
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
  rippleDisabled: boolean = false;

  cancel() {
    console.log('Cancel');
  }

  editRole(role: ChatRoomRole) {
    console.log('Edit role', role.name);
  }

  saveRole() {
    this.wsService.emit(
      'createRole',
      {
        chatId: this.chatId,
        role: this.role,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to create role',
            'Close',
            { duration: 3000 }
          );
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
          this._snackbar.open(
            res.error.message || 'Failed to delete role',
            'Close',
            { duration: 3000 }
          );
        } else {
          this._snackbar.open('Role deleted!', 'Close', { duration: 2000 });
        }
      }
    );
  }
}
