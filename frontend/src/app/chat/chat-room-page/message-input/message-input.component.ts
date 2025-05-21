import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Message } from '../../shared/models/message.model';

@Component({
  selector: 'app-message-input',
  imports: [FormsModule, MatIconModule, MatButtonModule],
  // inputs: ['message'], // Hey girl! You can specify the `@Input` this way if you want.
  // outputs: ['messageChange', 'send'], // Same for `@Output`.
  standalone: true,
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss',
})
export class MessageInputComponent implements AfterViewInit {
  @Input() message!: string;
  @Input() chatId: string | null = null;
  @Input() channelId: string | null = null;
  @Input() replyingToMessage: Message | null = null;

  @Output() messageChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();
  @Output() cancelReply = new EventEmitter<void>();
  @Output() replyToMessage = new EventEmitter<Message>();

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  ngAfterViewInit() {
    const textarea = this.textarea.nativeElement;
    textarea.addEventListener('input', () => {
      console.log('Input event fired');
      this.textarea.nativeElement.style.height = '1.5rem';
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    });
  }

  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      this.send.emit();
      this.textarea.nativeElement.style.height = '4.5rem';
    }
  }

  onClick(event: Event) {
    event.preventDefault();
    this.send.emit();
    this.textarea.nativeElement.style.height = '4.5rem';
  }

  // onReplyEnter(event: Event) {
  //   const keyboardEvent = event as KeyboardEvent;
  //   if (!keyboardEvent.shiftKey) {
  //     event.preventDefault();
  //     this.replyToMessage.emit();
  //     this.textarea.nativeElement.style.height = '4.5rem';
  //   }
  // }
}
