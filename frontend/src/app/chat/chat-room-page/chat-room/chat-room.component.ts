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
import { MemberListComponent } from '../member-list/member-list.component';
import { RoleManagementComponent } from '../role-management/role-management.component';

import { Channel } from '../../shared/models/channel.model';
import { ChannelPermissions } from '../../shared/models/permissions.alias';
import { Message } from '../../shared/models/message.model';
import { Member } from '../../shared/models/member.alias';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';
import { PrivateFriendListComponent } from '../private-friend-list/private-friend-list.component';
import { PrivateUserCardComponent } from '../private-user-card/private-user-card.component';

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
    RoleManagementComponent,
    PrivateFriendListComponent,
    PrivateUserCardComponent,
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
  replyMessages = signal<Message[]>([]);
  replyMessagesIds = signal<string[]>([]);
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
  readonly isModerator = signal(false);
  readonly chatName = signal('');
  readonly chatTopic = signal('');
  readonly chatThumbnail = signal<string | null>(null);
  readonly thumbnailFile = signal<File | null>(null);
  readonly isPrivate = signal(false);
  readonly channels = signal<Channel[]>([]);
  readonly members = signal<Member[]>([]);
  readonly populatedUsers = signal<PopulatedUser[]>([]);
  readonly editedChannels = signal<Record<string, Partial<Channel>>>({});
  readonly chatRoomRoles = signal<ChatRoomRole[]>([]);
  readonly currentUser = this.authService.currentUser;
  readonly selectedChannel = computed(() => {
    const id = this.channelId();
    return id ? this.channels().find((c) => c._id === id) : null;
  });
  readonly currentUserRoles = computed(() => {
    const id = this.currentUser()?.id;
    const member = this.members().find((m) => m.user === id);
    return member?.roles || [];
  });

  @ViewChild('scrollContainer')
  private scrollContainer!: ElementRef<HTMLDivElement>;

  private isAtBottom = signal(true);
  private lastMessageCount = 0;
  previousScrollHeight = 0;
  previousChannelId: string | null = null;

  // oldestMessageTimestamp: string | null = null;
  hasMoreMessages = true;
  isLoadingMessages = false;
  oldestMessageId: string | null = null;

  currentPermissions(): ChannelPermissions {
    return this.selectedChannel()?.permissions || {};
  }

  replyingToMessage = signal<Message | null>(null);

  currentUserFriends = computed(() => {
    const id = this.currentUser()?.id;
    const user = this.populatedUsers().find((u) => u.user._id === id);
    return user?.user?.friends || [];
  });

  currentUserBanList = computed(() => {
    const id = this.currentUser()?.id;
    const user = this.populatedUsers().find((u) => u.user._id === id);
    return user?.user.banlist || [];
  });

  currentUserPendingRequests() {
    const id = this.currentUser()?.id;
    const user = this.populatedUsers().find((u) => u.user._id === id);
    return user?.user?.pendingRequests || [];
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
      const container = this.scrollContainer?.nativeElement;
      const messages = this.messages();
      const currentCount = messages.length;

      const channelChanged = this.channelId() !== this.previousChannelId;
      const newMessageCount = currentCount > this.lastMessageCount;

      const appended = newMessageCount && this.isAtBottom();
      const prepended = newMessageCount && !this.isAtBottom();

      queueMicrotask(() => {
        if (!container) return;

        if (channelChanged || appended) {
          container.scrollTop = container.scrollHeight;
        } else if (prepended) {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - this.previousScrollHeight;
          container.scrollTop += scrollDiff;
        }

        this.previousChannelId = this.channelId();
        this.previousScrollHeight = container.scrollHeight;
        this.lastMessageCount = currentCount;
      });
    });

    effect(() => {
      const channelId = this.channelId();
      if (channelId) {
        this.messages.set([]);
        this.oldestMessageId = null;
        this.hasMoreMessages = true;
        this.loadInitialMessages();
      }
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

  onScroll(event: Event) {
    const container = this.scrollContainer.nativeElement;
    const threshold = 100;
    const position = container.scrollTop + container.clientHeight;
    const height = container.scrollHeight;
    this.isAtBottom.set(position + threshold >= height);

    const el = event.target as HTMLElement;
    if (el.scrollTop < 100) {
      this.loadOlderMessages();
    }
  }

  fetchChatRoom(chatId: string) {
    this.chatService.getChatRoom(chatId).subscribe((chat) => {
      this.chatName.set(chat.name);
      this.chatTopic.set(chat.topic);
      this.channels.set(chat.channels);
      this.members.set(chat.members);
      this.chatRoomRoles.set(chat.chatRoles);
      this.chatThumbnail.set(chat.thumbnail);
      this.isPrivate.set(chat.isPrivate);

      const currentUserId = this.authService.currentUser()?.id;
      this.wsService.joinChatRoom(currentUserId!);

      const member = chat.members.find((m) => m.user === currentUserId);

      if (this.channelId()) {
        this.loadInitialMessages();
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
        this.isModerator.set(member.roles.includes('Moderator'));
      } else {
        // Not found in members.
        // If user is not listed (maybe because they just created the room), fallback.
        this.isOwner.set(true);
        this.isAdmin.set(true);
      }

      if (this.isPrivate()) {
        this.chatService.getPrivateChatRooms().subscribe((rooms) => {
          // this.privateChatRooms.set(rooms);
          console.log(rooms);
        });
      }
    });
  }

  connect() {
    this.wsService.disconnect();
    this.wsService.connect();

    console.log('Connected to websocket.');

    this.wsService.joinChatRoom(this.chatId()!);

    this.wsService.listenChannelUpdates().subscribe((updatedChannels) => {
      this.channels.set(updatedChannels);
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
      this.messages.update((msgs) =>
        msgs.map((m) => (m._id === msg._id ? msg : m))
      );
    });

    this.wsService.listenMessageReplies().subscribe((msg) => {
      this.messages.update((msgs) => [...msgs, msg]);
    });

    this.wsService.listenUserUpdates().subscribe((updatedUser) => {
      this.populatedUsers.update((users) =>
        users.map((u) => {
          if (u.user._id === updatedUser._id) {
            u.user = updatedUser;
          }

          return u;
        })
      );
    });

    this.wsService.listenMemberUpdates().subscribe((updatedMember) => {
      this.populatedUsers.update((users) => {
        const user = users.find((u) => u.user._id === updatedMember.user);
        if (user) {
          user.roles = updatedMember.roles;
        }

        return users;
      });
    });

    this.wsService.listenChatUpdates().subscribe((updatedChat) => {
      this.chatName.set(updatedChat.name);
      this.members.set(updatedChat.members);
      this.chatRoomRoles.set(updatedChat.roles as ChatRoomRole[]);

      const validRoleNames = updatedChat.roles.map((r) => r.name);
      this.populatedUsers.update((users) => {
        return users.map((user) => ({
          ...user,
          roles: user.roles.filter((role) => validRoleNames.includes(role)),
        }));
      });
    });

    this.wsService.listenUserBans().subscribe((user) => {
      const currentUserId = this.authService.currentUser()?.id;
      if (!currentUserId) return;

      this.populatedUsers.update((users) => {
        return users.map((u) => {
          if (u.user._id === currentUserId) {
            const alreadyBanned = u.user.banlist.includes(user._id);
            return {
              ...u,
              user: {
                ...u.user,
                banlist: alreadyBanned
                  ? u.user.banlist
                  : [...u.user.banlist, user._id],
                friends: u.user.friends.filter((f) => f !== user._id),
              },
            };
          }
          return u;
        });
      });
    });

    this.wsService.listenUserBansByOther().subscribe((user) => {
      const currentUserId = this.authService.currentUser()?.id;
      if (!currentUserId) return;

      this.populatedUsers.update((users) => {
        return users.map((u) => {
          if (u.user._id === currentUserId) {
            const alreadyBanned = u.user.banlist.includes(user._id);
            return {
              ...u,
              user: {
                ...u.user,
                banlist: alreadyBanned
                  ? u.user.banlist
                  : [...u.user.banlist, user._id],
                friends: u.user.friends.filter((f) => f !== user._id),
              },
            };
          }
          return u;
        });
      });
    });

    this.wsService.listenUserUnbans().subscribe((user) => {
      const currentUserId = this.authService.currentUser()?.id;
      if (!currentUserId) return;

      this.populatedUsers.update((users) => {
        return users.map((u) => {
          if (u.user._id === currentUserId) {
            return {
              ...u,
              user: {
                ...u.user,
                banlist: u.user.banlist.filter((b) => b !== user.userId),
              },
            };
          }
          return u;
        });
      });
    });

    this.wsService.listenUserUnbansByOther().subscribe((user) => {
      const currentUserId = this.authService.currentUser()?.id;
      if (!currentUserId) return;

      this.populatedUsers.update((users) => {
        return users.map((u) => {
          if (u.user._id === currentUserId) {
            return {
              ...u,
              user: {
                ...u.user,
                banlist: u.user.banlist.filter((b) => b !== user.userId),
              },
            };
          }
          return u;
        });
      });
    });

    // I'll implement this later.
    // this.wsService.listenUserJoined().subscribe((user) => {
    //   this.populatedUsers.update((users) => [...users, user]);
    // });

    // this.wsService.listenUserLeft().subscribe(({ userId }) => {
    //   this.populatedUsers.update((users) =>
    //     users.filter((u) => u._id !== userId)
    //   );
    // });
  }

  loadInitialMessages() {
    this.isLoadingMessages = true;

    this.chatService
      .getMessages(
        this.chatId()!,
        this.channelId()!,
        20,
        this.oldestMessageId as string
      )
      .subscribe((messages) => {
        this.messages.set(messages);
        if (messages.length > 0) {
          this.oldestMessageId = messages[0]._id;
        }

        this.hasMoreMessages = messages.length >= 20;
        this.isLoadingMessages = false;

        const replyIds = messages
          .filter((m) => m.replyTo !== null)
          .map((m) => m.replyTo);

        this.replyMessagesIds.set(replyIds);

        if (replyIds.length > 0) {
          this.chatService
            .getReplyMessages(this.chatId()!, this.channelId()!, replyIds)
            .subscribe((replies) => {
              const olderReplies = this.replyMessages();
              this.replyMessages.set([...olderReplies, ...replies]);
              // console.log('Reply messages:', replies);
            });
        }

        // console.log('Reply messages ids:', this.replyMessagesIds());
        // console.log('Messages:', this.replyMessages());
      });
  }

  loadOlderMessages() {
    if (
      this.isLoadingMessages ||
      !this.hasMoreMessages ||
      !this.oldestMessageId
    )
      return;

    this.isLoadingMessages = true;

    this.chatService
      .getMessages(this.chatId()!, this.channelId()!, 20, this.oldestMessageId)
      .subscribe((olderMessages) => {
        if (olderMessages.length > 0) {
          this.oldestMessageId = olderMessages[0]._id;
          this.hasMoreMessages = olderMessages.length === 20;
        } else {
          this.hasMoreMessages = false;
        }

        const currentMessages = this.messages();
        // const existingIds = new Set(currentMessages.map((m) => m._id));
        // const filteredOlderMessages = olderMessages.filter(
        //   (m) => !existingIds.has(m._id)
        // );

        // this.messages.set([...filteredOlderMessages, ...currentMessages]);

        this.messages.set([...olderMessages, ...currentMessages]);

        this.isLoadingMessages = false;

        const merged = [...olderMessages, ...currentMessages];
        const unique = new Set(merged.map((m) => m._id));
        console.log('Duplicates?', merged.length !== unique.size);

        const replyIds = olderMessages
          .filter((m) => m.replyTo !== null)
          .map((m) => m.replyTo);

        this.replyMessagesIds.set(replyIds);

        if (replyIds.length > 0) {
          this.chatService
            .getReplyMessages(this.chatId()!, this.channelId()!, replyIds)
            .subscribe((replies) => {
              const olderReplies = this.replyMessages();
              this.replyMessages.set([...replies, ...olderReplies]);
              console.log('Reply messages:', replies);
            });
        }

        console.log('Reply messages ids:', this.replyMessagesIds());
        console.log('Messages:', this.replyMessages());
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

  saveChanges(file: File | null) {
    this.thumbnailFile.set(file);

    const formData = new FormData();
    formData.append('name', this.chatName());
    formData.append('topic', this.chatTopic());

    const checkFile = this.thumbnailFile();
    if (checkFile instanceof File) {
      formData.append('thumbnail', checkFile);
    }

    if (this.chatId()) {
      // Updating existing chat room.
      this.chatService
        .updateChatRoom(this.chatId()!, formData)
        .subscribe(() => console.log('Room updated'));
    } else {
      // Creating a new chat room.
      this.chatService.createChatRoom(formData).subscribe({
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
        }
      }
    );
  }

  startReplyingToMessage(message: Message) {
    console.log('Start replying to message: ', message);
    this.replyingToMessage.set(message);
  }

  cancelReply() {
    console.log('Cancel replying.');
    this.replyingToMessage.set(null);
  }

  replyToMessage() {
    const msg = this.message().trim();
    if (this.replyingToMessage() && msg) {
      this.wsService.emit(
        'reply',
        {
          messageId: this.replyingToMessage()?._id,
          text: msg,
        },
        (res) => {
          if (res?.error) {
            this._snackbar.open(
              res.error.message || 'Failed to reply message',
              'Close',
              { duration: 3000 }
            );
          }
        }
      );
    }

    this.message.set('');
  }

  updateChannelOrder(channelIds: string[]) {
    this.wsService.emit(
      'changeChannelOrder',
      {
        channelIds,
        chatId: this.chatId()!,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to change channel order',
            'Close',
            { duration: 3000 }
          );
        }
      }
    );
  }
}
