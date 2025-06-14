import { Component, Input } from '@angular/core';
import { Notification } from '../../shared/models/notification.model';

@Component({
  selector: 'app-notification-list',
  imports: [],
  standalone: true,
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent {
  @Input() notifications: Notification[] = [];

  constructor() {
    console.log(this.notifications);
  }
}
