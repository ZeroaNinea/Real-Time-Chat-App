import { Component, Input } from '@angular/core';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-private-user-card',
  imports: [MatIconModule, MatCardModule],
  standalone: true,
  templateUrl: './private-user-card.component.html',
  styleUrl: './private-user-card.component.scss',
})
export class PrivateUserCardComponent {
  @Input() members: PopulatedUser[] = [];
  @Input() currentUserId: string | undefined;

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
}
