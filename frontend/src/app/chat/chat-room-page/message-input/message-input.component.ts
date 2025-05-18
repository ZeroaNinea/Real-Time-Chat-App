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
  @Input() chatId: string | null = null;
  @Input() channelId: string | null = null;
  @Output() messageChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();

  ngAfterViewInit() {
    const textarea = this.textarea.nativeElement;
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    });
  }

  onEnter(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.send.emit();
    }
  }
}
