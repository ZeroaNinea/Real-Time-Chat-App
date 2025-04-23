import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-message-list',
  imports: [],
  standalone: true,
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
})
export class MessageListComponent {
  @Input() messages!: string[];
}
