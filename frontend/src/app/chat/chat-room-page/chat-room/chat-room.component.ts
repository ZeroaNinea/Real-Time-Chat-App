import {
  afterNextRender,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
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
import { ChannelListComponent } from '../../channel-list/channel-list.component';

@Component({
  selector: 'app-chat-room',
  imports: [
    MessageListComponent,
    MessageInputComponent,
    ChatRoomSettingsComponent,
    ChannelListComponent,
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
  newChannel = signal<string>('');
  readonly chatId = signal<string | null>(null);
  readonly channelId = signal(<string | null>null);
  readonly isCreatingNewRoom = computed(() => !this.chatId());
  readonly isOwner = signal(false);
  readonly isAdmin = signal(false);
  readonly chatName = signal('');
  readonly channels = signal<Channel[]>([]);
  readonly editedChannels = signal<Record<string, Partial<Channel>>>({});
  readonly currentUser = this.authService.currentUser;

  constructor() {
    afterNextRender(() => {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('chatId');
        const channelId = params.get('channelId');
        const prevId = this.chatId();

        this.chatId.set(id);
        this.channelId.set(channelId || '');

        if (id && id !== prevId) {
          this.fetchChatRoom(id);
          this.connect();
        } else if (!id) {
          this.isOwner.set(true);
          this.isAdmin.set(true);
        }
      });
    });
  }

  fetchChatRoom(chatId: string) {
    this.chatService.getChatRoom(chatId).subscribe((chat) => {
      this.chatName.set(chat.name);
      this.channels.set(chat.channels);

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
    this.wsService.disconnect();
    this.wsService.connect();

    this.wsService.joinChatRoom(this.chatId()!);

    this.sub = this.wsService.getMessages().subscribe((msgs) => {
      this.messages.set(msgs);
    });

    this.wsService.listenChannelUpdates().subscribe((updatedChannel) => {
      this.channels.update((chs) =>
        chs.map((c) => (c._id === updatedChannel._id ? updatedChannel : c))
      );
    });

    this.wsService.listenChannelAdditions().subscribe((channel) => {
      this.channels.update((chs) => [...chs, channel]);
    });

    this.wsService.listenChannelDeletions().subscribe(({ channelId }) => {
      this.channels.update((chs) => chs.filter((c) => c._id !== channelId));
    });
  }

  sendMessage() {
    const msg = this.message().trim();
    if (msg) {
      console.log('Sending message:', msg);
      this.wsService.sendMessage(msg);
      this.message.set('');
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.wsService.disconnect();
    this.wsService.off('channel-added');
    this.wsService.off('channel-renamed');
    this.wsService.off('channel-deleted');
  }

  addChannel(name: string) {
    const trimmed = name.trim();
    const chatId = this.chatId();
    if (!trimmed || !chatId) return;

    this.wsService.emit('addChannel', {
      channelName: trimmed,
      chatId,
    });
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
              this.chatService.addChannel(chatId, channelName.name)
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

  onChannelEdit(event: { channelId: string; key: keyof Channel; value: any }) {
    const { channelId, key, value } = event;

    this.wsService.emit('editChannel', {
      chatId: this.chatId(),
      channel: {
        _id: channelId,
        ...this.editedChannels()[channelId],
      },
    });
  }

  onChannelRemove(channelId: string) {
    if (!this.chatId()) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this channel?'
    );

    if (confirmed && this.chatId()) {
      this.wsService.emit('deleteChannel', {
        channelId,
      });
    }
  }

  onChannelRename({ id, newName }: { id: string; newName: string }) {
    this.wsService.emit('editChannel', {
      chatId: this.chatId(),
      channel: {
        _id: id,
        name: newName,
      },
    });
  }
}
