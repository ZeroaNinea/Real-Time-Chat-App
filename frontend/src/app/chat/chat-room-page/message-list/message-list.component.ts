import { DatePipe } from '@angular/common';
import { Component, Input, signal } from '@angular/core';

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
