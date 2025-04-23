import {
  afterNextRender,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { WebsocketService } from '../../shared/services/websocket/websocket.service';
import { Subscription } from 'rxjs';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ChatService } from '../../shared/services/chat-service/chat.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-room',
  imports: [
    MessageListComponent,
    MessageInputComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnDestroy {
  message = signal('');
  messages = signal<string[]>([]);
  private wsService = inject(WebsocketService);
  private sub?: Subscription;

  chatId = signal<string | null>(null);
  isAdmin = signal(false);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);

  roomName = signal('');
  channels = signal<string[]>([]);
  newChannel = signal('');

  constructor() {
    afterNextRender(() => {
      this.connect();
      this.chatId.set(this.route.snapshot.paramMap.get('chatId'));
      this.isAdmin.set(!this.chatId());
    });
  }

  connect() {
    this.wsService.connect();
    this.sub = this.wsService.getMessages().subscribe((msgs) => {
      this.messages.set(msgs);
    });
  }

  sendMessage() {
    const msg = this.message().trim();
    if (msg) {
      this.wsService.sendMessage(msg);
      this.message.set('');
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  addChannel() {
    const channel = this.newChannel().trim();
    if (channel) {
      this.channels.update((chs) => [...chs, channel]);
      this.newChannel.set('');
    }
  }

  async save() {
    const data = {
      name: this.roomName(),
      channels: this.channels().join(','),
    };

    this.chatService.createChatRoom(data).subscribe({
      next: (chat) => {
        this.router.navigate(['/chat-room', chat._id]);
      },
      error: (err) => {
        console.error('Failed to create chat room:', err);
      },
    });
  }
}
