import {
  afterNextRender,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { WebsocketService } from '../../shared/services/websocket/websocket.service';
import { Subscription } from 'rxjs';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ChatService } from '../../shared/services/chat-service/chat.service';

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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);

  roomName = signal('');
  newChannel = signal('');
  readonly chatId = signal<string | null>(null);
  readonly isCreatingNewRoom = computed(() => !this.chatId());
  readonly isOwner = signal(false);
  readonly isAdmin = signal(false);
  readonly chatName = signal('');
  readonly channels = signal<string[]>([]);

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
        this.chatService.addChannel(chat._id, 'Some-Channel-Name').subscribe({
          next: () => {
            console.log('Channel added successfully');
          },
          error: (err) => {
            console.error('Failed to add channel:', err);
          },
        });
        this.router.navigate(['/chat-room', chat._id]);
      },
      error: (err) => {
        console.error('Failed to create chat room:', err);
      },
    });
  }

  deleteChatRoom() {
    if (!this.chatId()) return;

    const confirmed = confirm(
      'Are you sure you want to delete this chat room?'
    );
    if (!confirmed) return;

    this.chatService.deleteChatRoom(this.chatId()!).subscribe({
      next: () => {
        this.router.navigate(['/main']);
      },
      error: (err) => {
        console.error('Failed to delete chat room:', err);
      },
    });
  }
}
