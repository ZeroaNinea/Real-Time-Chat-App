import {
  afterNextRender,
  Component,
  computed,
  inject,
  Input,
} from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';

import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';
import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';

import { UserCardDialogComponent } from '../../dialogs/user-card-dialog/user-card-dialog.component';
import { StatusDotComponent } from '../../shared/components/status-dot/status-dot.component';

@Component({
  selector: 'app-member-list',
  imports: [MatListModule, StatusDotComponent],
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
  @Input() channelId: string | null = null;
  @Input() chatRoomRoles: ChatRoomRole[] = [];
  @Input() currentUserFriends: string[] = [];
  @Input() currentUserBanList: string[] = [];
  @Input() currentUserPendingRequests: string[] = [];
  @Input() onlineUsers: Set<string> = new Set();
  @Input() typingUsers: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();

  environment = environment;

  constructor() {
    afterNextRender(() => {
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('copy-button')) {
          const encoded = target.getAttribute('data-code');
          if (encoded) {
            const decoded = decodeURIComponent(encoded);
            navigator.clipboard.writeText(decoded).then(() => {
              console.log('Copied to clipboard');
              target.classList.add('copied');
              const originalText = target.textContent;
              target.textContent = 'copied';

              setTimeout(() => {
                target.classList.remove('copied');
                target.textContent = originalText;
              }, 1200);
            });
          }
        }
      });
    });
  }

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
