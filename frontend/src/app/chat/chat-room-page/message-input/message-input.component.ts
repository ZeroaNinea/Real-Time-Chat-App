import { Component, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss',
})
export class MessageInputComponent {
  message!: string;
  messageChange = new EventEmitter<string>();
  send = new EventEmitter<void>();
}
