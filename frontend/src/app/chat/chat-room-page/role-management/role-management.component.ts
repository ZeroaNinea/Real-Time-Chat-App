import { Component, Input } from '@angular/core';

import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';
import { PopulatedUser } from '../../shared/models/populated-user.model';

@Component({
  selector: 'app-role-management',
  imports: [],
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
}
