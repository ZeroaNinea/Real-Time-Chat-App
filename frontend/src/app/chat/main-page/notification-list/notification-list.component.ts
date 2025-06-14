import { Component, Input } from '@angular/core';
import { PopulatedNotification } from '../../shared/models/notification.model';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-notification-list',
  imports: [
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,
  ],
  standalone: true,
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent {
  @Input() notifications: PopulatedNotification[] = [];

  acceptRequest(notification: PopulatedNotification) {
    // Emit event or call service to accept the friend request.
    console.log('Accepted', notification);
  }

  declineRequest(notification: PopulatedNotification) {
    // Emit event or call service to decline the friend request.
    console.log('Declined', notification);
  }
}
