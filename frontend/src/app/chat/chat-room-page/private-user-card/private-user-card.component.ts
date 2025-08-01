import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { WebsocketService } from '../../shared/services/websocket/websocket.service';
import { IdleService } from '../../../shared/services/idle/idle.service';

import { StatusDotComponent } from '../../shared/components/status-dot/status-dot.component';

import { PopulatedUser } from '../../shared/models/populated-user.model';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-private-user-card',
  imports: [StatusDotComponent, MatIconModule, MatCardModule, MatButtonModule],
  standalone: true,
  templateUrl: './private-user-card.component.html',
  styleUrl: './private-user-card.component.scss',
})
export class PrivateUserCardComponent {
  @Input() members: PopulatedUser[] = [];
  @Input() currentUserId: string | undefined;
  @Input() currentUserFriends: string[] = [];
  @Input() currentUserBanList: string[] = [];
  @Input() currentUserPendingRequests: string[] = [];
  @Input() channelId: string | null = null;
  @Input() onlineUsers: Set<string> = new Set();
  @Input() typingUsers: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();

  private wsService = inject(WebsocketService);
  private _snackbar = inject(MatSnackBar);

  private environment = environment;
  public isChecked: boolean = false;

  idleService = inject(IdleService);

  get otherUser(): PopulatedUser | undefined {
    return this.members.find((m) => m.user._id !== this.currentUserId);
  }

  copyId(userId: string | undefined): void {
    this.isChecked = true;
    navigator.clipboard.writeText(userId || '');

    setTimeout(() => {
      this.isChecked = false;
    }, 2000);
  }

  getAvatarUrl(userId: string | undefined): string {
    const avatar = this.members.find((m) => m.user._id === userId)?.user.avatar;
    return avatar
      ? `${this.environment.backendUrl}/${avatar}`
      : 'assets/camera.svg';
  }

  isFriend() {
    if (!this.otherUser) return false;
    return this.otherUser.user.friends.includes(this.currentUserId || '');
  }

  isBanned() {
    if (!this.otherUser) return false;
    return this.currentUserBanList.includes(this.otherUser.user._id);
  }

  isRequestPending() {
    if (!this.otherUser) return false;
    return this.currentUserPendingRequests.includes(this.otherUser.user._id);
  }

  sendFriendRequest() {
    this.wsService.emit(
      'sendFriendRequest',
      {
        receiverId: this.otherUser?.user._id || '',
      },
      (res: any) => {
        if (res?.error) {
          this._snackbar.open(res.error, 'Close', { duration: 3000 });
        } else {
          this.currentUserPendingRequests.push(this.otherUser?.user._id || '');

          this._snackbar.open(
            `Friend request sent to ${
              this.otherUser?.user.username || 'unknown user'
            }!`,
            'Close',
            {
              duration: 2000,
            }
          );
        }
      }
    );
  }

  banUser(user: PopulatedUser) {
    this.wsService.emit('banUser', user.user._id, (res) => {
      if (res?.error) {
        this._snackbar.open(res.error || 'Failed to ban user', 'Close', {
          duration: 3000,
        });
      } else {
        this.currentUserBanList.push(user.user._id);
        this.currentUserFriends = this.currentUserFriends.filter(
          (friend) => friend !== user.user._id
        );

        this._snackbar.open('Banned user!', 'Close', { duration: 2000 });
      }
    });
  }

  unbanUser(user: PopulatedUser) {
    this.wsService.emit('unbanUser', user.user._id, (res) => {
      if (res?.error) {
        this._snackbar.open(res.error || 'Failed to unban user', 'Close', {
          duration: 3000,
        });
      } else {
        this.currentUserBanList = this.currentUserBanList.filter(
          (id) => id !== user.user._id
        );

        this._snackbar.open('Unbanned user!', 'Close', { duration: 2000 });
      }
    });
  }
}
