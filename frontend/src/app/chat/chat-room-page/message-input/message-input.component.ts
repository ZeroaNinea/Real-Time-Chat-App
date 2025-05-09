import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  imports: [FormsModule],
  // inputs: ['message'], // Hey girl! You can specify the `@Input` this way if you want.
  // outputs: ['messageChange', 'send'], // Same for `@Output`.
  standalone: true,
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss',
})
export class MessageInputComponent {
  @Input() message!: string;
  @Output() messageChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();
}
