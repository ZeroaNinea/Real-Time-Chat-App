import { Component, EventEmitter, Input, Output } from '@angular/core';

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

import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';
import { PopulatedUser } from '../../shared/models/populated-user.model';

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
  @Input() chatId!: string | null;
  @Input() roles: ChatRoomRole[] = [];
  @Input() members: PopulatedUser[] = [];
  @Input() currentUserId!: string | undefined;
  @Input() isAdmin = false;
  @Input() isOwner = false;
  @Input() isModerator = false;

  @Output() createRole = new EventEmitter<ChatRoomRole>();

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
    console.log('Edit', role.name);
  }

  deleteRole(role: ChatRoomRole) {
    console.log('Delete role', role.name);
  }
}
