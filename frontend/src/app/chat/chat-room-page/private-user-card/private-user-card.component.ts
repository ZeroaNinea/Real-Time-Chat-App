import { Component, Input } from '@angular/core';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-private-user-card',
  imports: [],
  standalone: true,
  templateUrl: './private-user-card.component.html',
  styleUrl: './private-user-card.component.scss',
})
export class PrivateUserCardComponent {
  @Input() members: PopulatedUser[] = [];
  @Input() currentUserId: string | undefined;

  environment = environment;

  getAvatarUrl(userId: string): string {
    const avatar = this.members.find((m) => m.user._id === userId)?.user.avatar;
    return avatar
      ? `${this.environment.backendUrl}/${avatar}`
      : 'assets/camera.svg';
  }
}
