import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';

import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';
import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';

import { UserCardDialogComponent } from '../../dialogs/user-card-dialog/user-card-dialog.component';

@Component({
  selector: 'app-member-list',
  imports: [MatListModule],
  standalone: true,
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
})
export class MemberListComponent {
  private dialog = inject(MatDialog);

  @Input() members: PopulatedUser[] = [];
  @Input() currentUserId: string | undefined;
  @Input() currentUserRoles: string[] = [];
  @Input() isAdmin: boolean = false;
  @Input() isOwner: boolean = false;
  @Input() isModerator: boolean = false;
  @Input() chatId: string | null = null;
  @Input() chatRoomRoles: ChatRoomRole[] = [];
  @Input() currentUserFriends: string[] = [];
  @Input() currentUserBanList: string[] = [];
  @Input() currentUserPendingRequests: string[] = [];
  environment = environment;

  getAvatarUrl(userId: string): string {
    const avatar = this.members.find((m) => m.user._id === userId)?.user.avatar;
    return avatar
      ? `${this.environment.backendUrl}/${avatar}`
      : 'assets/camera.svg';
  }

  openUserDialog(member: PopulatedUser) {
    const dialogRef = this.dialog.open(UserCardDialogComponent, {
      data: {
        selectedUser: member,
        currentUserId: this.currentUserId,
        chatId: this.chatId,
        isAdmin: this.isAdmin,
        isOwner: this.isOwner,
        isModerator: this.isModerator,
        chatRoomRoles: this.chatRoomRoles,
        currentUserRoles: this.currentUserRoles,
        currentUserFriends: this.currentUserFriends,
        currentUserBanList: this.currentUserBanList,
        currentUserPendingRequests: this.currentUserPendingRequests,
      },
      width: '400px',
    });
  }

  trimText(text: string, max: number): string {
    if (!text) return '';
    const trimmed = text.slice(0, max).trim();
    if (trimmed.length === text.length) return trimmed;
    return trimmed.replace(/\.+$/, '') + '...';
  }
}
