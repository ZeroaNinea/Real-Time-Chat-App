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
import { AuthService } from '../../../auth/auth.service';
import { ChatRoomSettingsComponent } from '../chat-room-settings/chat-room-settings.component';
import { Channel } from '../../shared/models/channel.model';

@Component({
  selector: 'app-chat-room',
  imports: [
    MessageListComponent,
    MessageInputComponent,
    ChatRoomSettingsComponent,
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
  private authService = inject(AuthService);

  roomName = signal('');
  newChannel = signal('');
  readonly chatId = signal<string | null>(null);
  readonly isCreatingNewRoom = computed(() => !this.chatId());
  readonly isOwner = signal(false);
  readonly isAdmin = signal(false);
  readonly chatName = signal('');
  readonly channels = signal<string[]>([]);
  // readonly channels = signal<Channel[]>([]);
  readonly currentUser = this.authService.currentUser;

  constructor() {
    afterNextRender(() => {
      this.connect();
      const id = this.route.snapshot.paramMap.get('chatId');
      this.chatId.set(id);

      if (id) {
        // There is chatId -> fetch from server.
        this.fetchChatRoom(id);
      } else {
        // No chatId -> creating new room.
        this.isOwner.set(true);
        this.isAdmin.set(true);
      }
    });
  }

  fetchChatRoom(chatId: string) {
    this.chatService.getChatRoom(chatId).subscribe((chat) => {
      this.chatName.set(chat.name);
      this.channels.set([]);

      const currentUserId = this.authService.currentUser()?.id;
      const member = chat.members.find((m) => m.user === currentUserId);

      if (member) {
        // Found in members.
        this.isOwner.set(member.roles.includes('Owner'));
        this.isAdmin.set(
          member.roles.includes('Admin') || member.roles.includes('Owner')
        );
      } else {
        // Not found in members.
        // If user is not listed (maybe because they just created the room), fallback.
        this.isOwner.set(true);
        this.isAdmin.set(true);
      }
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

  saveChanges() {
    console.log('Chat name:', this.chatName());
    if (this.chatId()) {
      // Updating existing chat room.
      this.chatService
        .updateChatRoom(this.chatId()!, {
          name: this.chatName(),
        })
        .subscribe(() => console.log('Room updated'));
    } else {
      // Creating a new chat room.
      this.chatService
        .createChatRoom({
          name: this.chatName(),
        })
        .subscribe({
          next: (createdRoom) => {
            // After chat room is created, create channels.
            const chatId = createdRoom._id;

            const channelCreations = this.channels().map((channelName) =>
              this.chatService.addChannel(chatId, channelName)
            );

            // Execute all channel creations.
            Promise.all(channelCreations.map((obs) => obs.toPromise()))
              .then(() => {
                console.log('All channels created');
                this.router.navigate(['/chat-room', chatId]).then(() => {
                  this.fetchChatRoom(chatId);
                });
              })
              .catch((error) => {
                console.error('Failed to create channels:', error);
              });
          },
          error: (err) => {
            console.error('Failed to create chat room:', err);
          },
        });
    }
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
