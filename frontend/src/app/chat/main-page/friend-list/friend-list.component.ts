import { Component, Input } from '@angular/core';
import { PopulatedUser } from '../../shared/models/populated-user.model';

@Component({
  selector: 'app-friend-list',
  imports: [],
  standalone: true,
  templateUrl: './friend-list.component.html',
  styleUrl: './friend-list.component.scss',
})
export class FriendListComponent {
  // @Input() friends: PopulatedUser[] = [];
  @Input() friends: { name: string; status: string }[] = [];
}
