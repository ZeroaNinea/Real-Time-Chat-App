import { Component, Input } from '@angular/core';
import { AbbreviatedPopulatedUser } from '../../shared/models/populated-user.model';

@Component({
  selector: 'app-friend-list',
  imports: [],
  standalone: true,
  templateUrl: './friend-list.component.html',
  styleUrl: './friend-list.component.scss',
})
export class FriendListComponent {
  @Input() friends: AbbreviatedPopulatedUser[] = [];
  // @Input() friends: { name: string; status: string }[] = [];
}
