import { Component, Input } from '@angular/core';
import { AbbreviatedPopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-friend-list',
  imports: [],
  standalone: true,
  templateUrl: './friend-list.component.html',
  styleUrl: './friend-list.component.scss',
})
export class FriendListComponent {
  @Input() friends: AbbreviatedPopulatedUser[] = [];
  @Input() banList: AbbreviatedPopulatedUser[] = [];

  environment = environment;

  getAvatarUrl(friend: AbbreviatedPopulatedUser) {
    return friend.avatar
      ? `${this.environment.backendUrl}/${friend.avatar}`
      : 'assets/camera.svg';
  }
}
