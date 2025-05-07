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
  // readonly channels = signal<string[]>([]);
  readonly channels = signal<Channel[]>([]);
  readonly editedChannels = signal<Record<string, Partial<Channel>>>({});
  readonly currentUser = this.authService.currentUser;

  constructor() {
    // afterNextRender(() => {
    //   this.connect();
    //   const id = this.route.snapshot.paramMap.get('chatId');
    //   this.chatId.set(id);
    //   this.channelId.set(this.route.snapshot.paramMap.get('channelId') || '');

    //   if (id) {
    //     // There is chatId -> fetch from server.
    //     this.fetchChatRoom(id);
    //   } else {
    //     // No chatId -> creating new room.
    //     this.isOwner.set(true);
    //     this.isAdmin.set(true);
    //   }
    // });
    afterNextRender(() => {
      this.connect();

      this.route.paramMap.subscribe((params) => {
        const id = params.get('chatId');
        const channelId = params.get('channelId');

        this.chatId.set(id);
        this.channelId.set(channelId || '');

        if (id) {
          this.fetchChatRoom(id);
        } else {
          this.isOwner.set(true);
          this.isAdmin.set(true);
        }
      });
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

    this.wsService.listenChannelUpdates().subscribe((updatedChannel) => {
      this.channels.update((chs) =>
        chs.map((c) => (c._id === updatedChannel._id ? updatedChannel : c))
      );
    });

    this.wsService.listenChannelAdditions().subscribe((channel) => {
      this.channels.update((chs) => [...chs, channel]);
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

  addChannel(name: string) {
    // const channel = this.newChannel().trim();
    // if (channel) {
    //   this.channels.update((chs) => [...chs, { name: channel } as Channel]);
    //   this.newChannel.set('');
    // }
    // console.log('Add channel');
    // console.log('New channel:', this.newChannel());
    // const name = this.newChannel().trim();
    // if (!name || !this.chatId()) return;

    // this.wsService.emit('addChannel', {
    //   name,
    //   chatId: this.chatId(),
    // });

    // this.newChannel.set('');
    const trimmed = name.trim();
    if (!trimmed || !this.chatId) return;

    this.wsService.emit('addChannel', {
      name: trimmed,
      chatId: this.chatId,
    });

    console.log('Emitted addChannel:', trimmed);
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

    // this.editedChannels.update((prev) => ({
    //   ...prev,
    //   [channelId]: {
    //     ...prev[channelId],
    //     [key]: value,
    //   },
    // }));
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

    this.chatService.deleteChannel(this.chatId()!, channelId).subscribe(() => {
      this.channels.update((chs) => chs.filter((ch) => ch._id !== channelId));
    });
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
