import { Component, Input } from '@angular/core';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

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
}
