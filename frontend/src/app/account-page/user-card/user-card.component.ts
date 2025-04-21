import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { User } from '../../auth/shared/user.model';

@Component({
  selector: 'app-user-card',
  imports: [DatePipe],
  standalone: true,
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
})
export class UserCardComponent {
  @Input() user!: User;
}
