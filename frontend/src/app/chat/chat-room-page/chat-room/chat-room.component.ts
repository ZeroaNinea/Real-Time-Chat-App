import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injectable,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Subscription } from 'rxjs';

import { WebsocketService } from '../../shared/services/websocket/websocket.service';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ChatService } from '../../shared/services/chat-service/chat.service';
import { AuthService } from '../../../auth/auth.service';
import { ChatRoomSettingsComponent } from '../chat-room-settings/chat-room-settings.component';
import { ChannelListComponent } from '../channel-list/channel-list.component';
import { ChannelTopicComponent } from '../channel-topic/channel-topic.component';
import { PermissionsComponent } from '../permissions/permissions.component';

import { RenameChannelDialogComponent } from '../../dialogs/rename-channel-dialog/rename-channel-dialog.component';
import { DeleteChannelDialogComponent } from '../../dialogs/delete-channel-dialog/delete-channel-dialog.component';
import { PermissionsDialogComponent } from '../../dialogs/permissions-dialog/permissions-dialog.component';

import { Channel } from '../../shared/models/channel.model';
import { ChannelPermissions } from '../../shared/models/permissions.aliase';
import { Message } from '../../shared/models/message.model';
import { Member } from '../../shared/models/member.aliase';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { MemberListComponent } from '../member-list/member-list.component';

@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-chat-room',
  imports: [
    MessageListComponent,
    MessageInputComponent,
    ChatRoomSettingsComponent,
    ChannelListComponent,
    ChannelTopicComponent,
    PermissionsComponent,
    MemberListComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnDestroy {
  message = signal('');
  messages = signal<Message[]>([]);
  private wsService = inject(WebsocketService);
  private sub?: Subscription;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private _snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  roomName = signal('');
  newChannel = signal<string>('');
  readonly chatId = signal<string | null>(null);
  readonly channelId = signal(<string | null>null);
  readonly isCreatingNewRoom = computed(() => !this.chatId());
  readonly isOwner = signal(false);
  readonly isAdmin = signal(false);
  readonly chatName = signal('');
  readonly channels = signal<Channel[]>([]);
  readonly members = signal<Member[]>([]);
  readonly populatedUsers = signal<PopulatedUser[]>([]);
  readonly editedChannels = signal<Record<string, Partial<Channel>>>({});
  readonly currentUser = this.authService.currentUser;
  readonly selectedChannel = computed(() => {
    const id = this.channelId();
    return id ? this.channels().find((c) => c._id === id) : null;
  });

  @ViewChild('scrollContainer')
  private scrollContainer!: ElementRef<HTMLDivElement>;

  private isAtBottom = signal(true);
  private lastMessageCount = 0;

  currentPermissions(): ChannelPermissions {
    return this.selectedChannel()?.permissions || {};
  }

  constructor() {
    effect(() => {
      // Scroll when messages change and user is at bottom.
      const msgs = this.messages();
      const container = this.scrollContainer?.nativeElement;
      if (!container) return;

      const newMessageCount = msgs.length;

      if (newMessageCount > this.lastMessageCount && this.isAtBottom()) {
        queueMicrotask(() => {
          container.scrollTop = container.scrollHeight;
        });
      }

      this.lastMessageCount = newMessageCount;
    });

    effect(() => {
      const currentChannel = this.channelId();
      this.isAtBottom.set(true);

      queueMicrotask(() => {
        const container = this.scrollContainer?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });

      this.lastMessageCount = this.messages().length;
    });

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

  onScroll() {
    const container = this.scrollContainer.nativeElement;
    const threshold = 100;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;
    this.isAtBottom.set(position + threshold >= height);
  }

  fetchChatRoom(chatId: string) {
    this.chatService.getChatRoom(chatId).subscribe((chat) => {
      this.chatName.set(chat.name);
      this.channels.set(chat.channels);
      this.members.set(chat.members);

      const currentUserId = this.authService.currentUser()?.id;
      console.log('Current user ID:', currentUserId);
      const member = chat.members.find((m) => m.user === currentUserId);

      if (this.channelId()) {
        this.chatService
          .getMessages(this.chatId()!, this.channelId()!)
          .subscribe((messages) => this.messages.set(messages));
      }

      this.chatService
        .getChatMembers(this.chatId()!)
        .subscribe((members) => this.populatedUsers.set(members));

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

    this.wsService.listenNewMessage().subscribe((msg) => {
      this.messages.update((msgs) => [...msgs, msg]);
    });

    this.wsService.listenMessageDeletions().subscribe(({ messageId }) => {
      this.messages.update((msgs) => msgs.filter((m) => m._id !== messageId));
    });

    this.wsService
      .listenChannelMessageDeletions()
      .subscribe(({ channelId }) => {
        this.messages.update((msgs) =>
          msgs.filter((m) => m.channelId !== channelId)
        );
      });

    this.wsService.listenMessageEdits().subscribe((msg) => {
      console.log('The listener is called. Message:', msg);
      this.messages.update((msgs) =>
        msgs.map((m) => (m._id === msg._id ? msg : m))
      );
    });
  }

  sendMessage() {
    const msg = this.message().trim();
    if (msg) {
      console.log('Sending message:', msg);
      this.wsService.sendMessage(msg, this.chatId()!, this.channelId()!);
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

  addChannel() {
    const dialogRef = this.dialog.open(RenameChannelDialogComponent, {
      data: { isAddChannel: true },
    });

    dialogRef.afterClosed().subscribe((newName: string | null) => {
      if (newName) {
        const trimmed = newName.trim();
        const chatId = this.chatId();
        if (!trimmed || !chatId) return;
        this.wsService.emit('addChannel', {
          channelName: trimmed,
          chatId,
        });
      } else {
        return;
      }
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
    const dialogRef = this.dialog.open(DeleteChannelDialogComponent, {
      data: { isChatRoom: true },
    });

    dialogRef.afterClosed().subscribe((isDelete: boolean) => {
      if (isDelete && this.chatId()) {
        this.chatService.deleteChatRoom(this.chatId()!).subscribe({
          next: () => {
            this.router.navigate(['/main']);
          },
          error: (err) => {
            console.error('Failed to delete chat room:', err);
          },
        });
      } else {
        return;
      }
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
    const dialogRef = this.dialog.open(DeleteChannelDialogComponent, {
      data: { isChatRoom: false },
    });

    dialogRef.afterClosed().subscribe((isDelete: boolean) => {
      if (isDelete && this.chatId()) {
        this.wsService.emit('deleteChannel', {
          channelId,
        });
      } else {
        return;
      }
    });
  }

  onChannelRename({ id, name }: { id: string; name: string }) {
    const dialogRef = this.dialog.open(RenameChannelDialogComponent, {
      data: { currentName: name },
    });

    dialogRef.afterClosed().subscribe((newName: string | null) => {
      if (!newName || newName.trim() === '' || newName === name) return;

      this.wsService.emit<
        { channelId: string; name: string },
        { error?: { message: string } }
      >('renameChannel', { channelId: id, name: newName }, (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to rename channel',
            'Close',
            { duration: 3000 }
          );
        }
      });
    });
  }

  onTopicChange(newTopic: string) {
    const id = this.channelId();
    if (!id) return;

    this.wsService.emit('editChannelTopic', {
      channelId: id,
      topic: newTopic,
    });
  }

  openPermissionsDialog() {
    const dialogRef = this.dialog.open(PermissionsDialogComponent, {
      data: {
        channelId: this.channelId(),
        currentPermissions: this.currentPermissions(),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.wsService.emit('updateChannelPermissions', {
          channelId: this.channelId()!,
          permissions: result,
        });
      }
    });
  }

  deleteMessage(messageId: string) {
    this.wsService.emit(
      'deleteMessage',
      {
        messageId,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to delete message',
            'Close',
            { duration: 3000 }
          );
        }
      }
    );
  }

  editMessage(message: Message) {
    console.log('Trigger edit:', message);
    this.wsService.emit(
      'editMessage',
      {
        messageId: message._id,
        text: message.text,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to edit message',
            'Close',
            { duration: 3000 }
          );
        } else {
          this._snackbar.open('Message edited successfully', 'Close', {
            duration: 3000,
          });
        }
      }
    );
  }
}
