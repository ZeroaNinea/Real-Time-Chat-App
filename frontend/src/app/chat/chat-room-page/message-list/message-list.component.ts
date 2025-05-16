import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Message } from '../../shared/models/message.model';

@Component({
  selector: 'app-message-list',
  imports: [DatePipe],
  standalone: true,
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
})
export class MessageListComponent {
  @Input() messages!: Message[];
}
