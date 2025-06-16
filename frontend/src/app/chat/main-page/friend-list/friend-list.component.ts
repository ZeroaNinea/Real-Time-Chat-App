import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

import { AbbreviatedPopulatedUser } from '../../shared/models/populated-user.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-friend-list',
  imports: [MatIconModule, MatTooltipModule, MatListModule, MatButtonModule],
  standalone: true,
  templateUrl: './friend-list.component.html',
  styleUrl: './friend-list.component.scss',
})
export class FriendListComponent {
  @Input() friends: AbbreviatedPopulatedUser[] = [];
  @Input() banList: AbbreviatedPopulatedUser[] = [];

  @Output() remove = new EventEmitter<AbbreviatedPopulatedUser>();
  @Output() message = new EventEmitter<AbbreviatedPopulatedUser>();
  @Output() ban = new EventEmitter<AbbreviatedPopulatedUser>();
  @Output() unban = new EventEmitter<AbbreviatedPopulatedUser>();

  environment = environment;

  getAvatarUrl(user: AbbreviatedPopulatedUser) {
    return user.avatar
      ? `${this.environment.backendUrl}/${user.avatar}`
      : 'assets/camera.svg';
  }
}
