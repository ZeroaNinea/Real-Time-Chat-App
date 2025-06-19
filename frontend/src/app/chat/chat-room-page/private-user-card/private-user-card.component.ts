import { Component, inject, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { WebsocketService } from '../../shared/services/websocket/websocket.service';
import { PopulatedUser } from '../../shared/models/populated-user.model';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-private-user-card',
  imports: [MatIconModule, MatCardModule, MatButtonModule],
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

  private wsService = inject(WebsocketService);
  private _snackbar = inject(MatSnackBar);

  environment = environment;

  get otherUser(): PopulatedUser | undefined {
    return this.members.find((m) => m.user._id !== this.currentUserId);
  }

  copyId(userId: string | undefined): void {
    navigator.clipboard.writeText(userId || '');
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
        receiverId: this.currentUserId,
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
        this._snackbar.open(
          res.error.message || 'Failed to ban user',
          'Close',
          { duration: 3000 }
        );
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
        this._snackbar.open(
          res.error.message || 'Failed to unban user',
          'Close',
          { duration: 3000 }
        );
      } else {
        this.currentUserBanList = this.currentUserBanList.filter(
          (id) => id !== user.user._id
        );

        this._snackbar.open('Unbanned user!', 'Close', { duration: 2000 });
      }
    });
  }
}
