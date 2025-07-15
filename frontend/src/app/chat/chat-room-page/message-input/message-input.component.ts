import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PickerModule } from '@ctrl/ngx-emoji-mart';

import { Message } from '../../shared/models/message.model';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { GifPickerComponent } from '../../../shared/components/gif-picker/gif-picker.component';
import { WebsocketService } from '../../shared/services/websocket/websocket.service';

@Component({
  selector: 'app-message-input',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    PickerModule,
    GifPickerComponent,
  ],
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
  @Input() currentUserId: string | undefined;
  @Input() replyingToMessage: Message | null = null;
  @Input() members: PopulatedUser[] = [];
  @Input() isPrivate: boolean = false;
  @Input() typingUsers: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();

  @Output() messageChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();
  @Output() sendPrivate = new EventEmitter<void>();
  @Output() cancelReply = new EventEmitter<void>();
  @Output() replyToMessage = new EventEmitter<Message>();
  @Output() replyToPrivateMessage = new EventEmitter<Message>();

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  showEmojiPicker = false;
  showGifPicker = false;

  private wsService = inject(WebsocketService);

  private typingTimeout: any;

  ngAfterViewInit() {
    const textarea = this.textarea.nativeElement;
    textarea.addEventListener('input', () => {
      this.textarea.nativeElement.style.height = '1.5rem';
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    });
  }

  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      event.preventDefault();
      console.log('is private', this.isPrivate);
      if (this.isPrivate) {
        this.sendPrivate.emit();
      } else {
        this.send.emit();
      }
      this.textarea.nativeElement.style.height = '4.5rem';
      this.wsService.emitTypingStop(this.chatId, this.channelId);
    }
  }

  onClick(event: Event) {
    event.preventDefault();
    if (this.isPrivate) {
      this.sendPrivate.emit();
    } else {
      this.send.emit();
    }
    this.textarea.nativeElement.style.height = '4.5rem';
    this.wsService.emitTypingStop(this.chatId, this.channelId);
  }

  onReply(event: Event) {
    event.preventDefault();
    if (this.replyingToMessage) {
      if (this.isPrivate) {
        this.replyToPrivateMessage.emit(this.replyingToMessage);
      } else {
        this.replyToMessage.emit(this.replyingToMessage);
      }
    }
    this.textarea.nativeElement.style.height = '4.5rem';
  }

  getRecipientUsername() {
    if (this.replyingToMessage) {
      return this.members.find(
        (m) => m.user._id === this.replyingToMessage?.sender
      )?.user.username;
    }
    return '';
  }

  addEmoji(event: any) {
    const emoji = event.emoji.native || event.emoji;
    const textarea = this.textarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const before = this.message.slice(0, start);
    const after = this.message.slice(end);

    this.message = before + emoji + after;
    this.messageChange.emit(this.message);

    setTimeout(() => {
      const pos = start + emoji.length;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
  }

  onGifSelected(url: string) {
    this.message += ` ![](${url}) `;
    this.messageChange.emit(this.message);
    this.showGifPicker = false;
  }

  onInputChange() {
    this.wsService.emitTypingStart(this.chatId, this.channelId);

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.wsService.emitTypingStop(this.chatId, this.channelId);
    }, 3000);
  }
}
