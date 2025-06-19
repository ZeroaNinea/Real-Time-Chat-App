import { Component, Input } from '@angular/core';
import { PopulatedUser } from '../../shared/models/populated-user.model';

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
}
