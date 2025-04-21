import { Component, inject, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { User } from '../../auth/shared/user.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-card',
  imports: [DatePipe, MatCardModule],
  standalone: true,
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
})
export class UserCardComponent {
  @Input() user!: User;
  environment = environment;
}
