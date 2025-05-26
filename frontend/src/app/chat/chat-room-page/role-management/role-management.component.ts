import { Component, Input } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';

import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { MatIconModule } from '@angular/material/icon';

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

  role: Partial<ChatRoomRole> = {};
  allPermissions = [
    'canBan',
    'canMute',
    'canDeleteMessages',
    'canEditChannels',
  ];
  rippleDisabled: boolean = false;

  cancel() {
    console.log('Cancel');
  }

  deleteRole(role: ChatRoomRole) {
    console.log('Delete role', role.name);
  }
}
