import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import {
  afterEveryRender,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Message } from '../../shared/models/message.model';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';
import { Reaction } from '../../shared/models/reaction.alias';

import { UserCardDialogComponent } from '../../dialogs/user-card-dialog/user-card-dialog.component';
import { PickerComponent, PickerModule } from '@ctrl/ngx-emoji-mart';

import { environment } from '../../../../environments/environment';
import { TextFormatPipe } from '../../../shared/pipes/text-format/text-format.pipe';

import { ChatService } from '../../shared/services/chat-service/chat.service';
import { WebsocketService } from '../../shared/services/websocket/websocket.service';

@Component({
  selector: 'app-message-list',
  imports: [
    PickerComponent,
    // ReactionCountComponent,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule,
    PickerModule,
    TextFormatPipe,
    AsyncPipe,
    DatePipe,
    CommonModule,
  ],
  standalone: true,
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
  animations: [
    trigger('countChange', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(20%)' }),
        animate(
          '200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class MessageListComponent implements OnInit, OnDestroy {
  @Input() messages!: Message[];
  @Input() replyMessages: Message[] = [];
  @Input() members!: PopulatedUser[];
  @Input() isAdmin: boolean = false;
  @Input() isOwner: boolean = false;
  @Input() isModerator: boolean = false;
  @Input() chatRoomRoles: ChatRoomRole[] = [];
  @Input() currentUserRoles: string[] = [];
  @Input() currentUserFriends: string[] = [];
  @Input() currentUserBanList: string[] = [];
  @Input() currentUserPendingRequests: string[] = [];
  environment = environment;

  hoveredMessageId: string | null = null;
  editingMessageId: string | null = null;
  editedText: string = '';

  @Input() currentUserId!: string | undefined;
  @Input() channelId!: string | null;
  @Input() chatId: string | null = null;
  @Input() isPrivate: boolean = false;
  @Input() animatingReactionsSocket = new Set<string>();

  @Output() onDelete = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<Message>();
  @Output() onReply = new EventEmitter<Message>();
  @Output() loadOlderMessages = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private chatService = inject(ChatService);
  private wsService = inject(WebsocketService);
  private _snackbar = inject(MatSnackBar);

  private isSameMinute(a: Message, b: Message): boolean {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return Math.abs(timeA - timeB) < 60000;
  }

  favoriteGifs: string[] = [];

  get filteredMessages() {
    if (this.isPrivate) {
      return this.messages;
    }

    return this.messages.filter((msg) => msg.channelId === this.channelId);
  }

  isCopied = false;
  showReactionPicker = false;
  activeReactionMessageId: string | null = null;
  animatingReactions = new Set<string>();
  tempReactionCounts = new Map<string, number>();

  constructor() {
    afterEveryRender(() => {
      this.renderTikToks();
    });

    this.chatService.favorites$.subscribe((favs) => {
      this.favoriteGifs = favs;
    });
  }

  ngOnInit() {
    document.body.addEventListener('click', this.handleGifClick.bind(this));
  }

  ngOnDestroy() {
    document.body.removeEventListener('click', this.handleGifClick.bind(this));
  }

  handleGifClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest('.marked-star-button') as HTMLElement;

    if (!button) return;

    const gifUrl = button.dataset['gifUrl']!;
    const particleContainer = button
      .closest('.marked-star-wrapper')
      ?.querySelector('.marked-particle-container');

    if (particleContainer) {
      this.animateParticles(particleContainer);
    }

    this.addRippleEffect(button, event);
    this.toggleFavorite(gifUrl);
    this.toggleFilledClass(gifUrl, button);
  }

  addRippleEffect(button: HTMLElement, event: MouseEvent) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 150);
  }

  animateParticles(container: Element) {
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      requestAnimationFrame(() => {
        particle.style.setProperty('height', `6px`);
        particle.style.setProperty('width', `6px`);
        particle.style.setProperty('--x', `${Math.random() * 2 - 1}`);
        particle.style.setProperty('--y', `${Math.random() * 2 - 1}`);
      });
      container.appendChild(particle);

      setTimeout(() => {
        container.removeChild(particle);
      }, 600);
    }
  }

  toggleFavorite(gifUrl: string) {
    if (this.favoriteGifs.includes(gifUrl)) {
      this.chatService.removeFavorite(gifUrl).subscribe(() => {
        console.log('Favorite removed:', gifUrl);
      });
    } else {
      this.chatService.addFavorite(gifUrl).subscribe(() => {
        console.log('Favorite added:', gifUrl);
      });
    }
  }

  toggleFilledClass(gifUrl: string, button: HTMLElement) {
    const icon = button.querySelector('span.material-symbols-outlined');

    if (!icon) {
      console.error('Icon not found inside the button');
      return;
    }

    const isFavorited = this.favoriteGifs.includes(gifUrl);

    if (isFavorited) {
      icon.classList.remove('filled');
    } else {
      icon.classList.add('filled');
    }
  }

  renderTikToks() {
    const placeholders = document.querySelectorAll('.tiktok-fetching');

    placeholders.forEach((el) => {
      const url = el.getAttribute('data-url');
      if (!url) return;

      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
        .then((res) => res.json())
        .then((data) => {
          const match = data.html.match(/<blockquote[\s\S]*<\/blockquote>/);
          if (match) {
            el.innerHTML = match[0];
          }

          if (!document.getElementById('tiktok-embed-script')) {
            const script = document.createElement('script');
            script.src = 'https://www.tiktok.com/embed.js';
            script.id = 'tiktok-embed-script';
            script.async = true;
            script.onload = () => {
              (window as any).tiktok?.embeds?.load?.();

              setTimeout(() => {
                const iframe = el.querySelector('iframe');
                const blockquote = el.querySelector('blockquote');
                console.log('TikTok debug:', {
                  iframe,
                  blockquote,
                  html: el.innerHTML,
                });

                if (!iframe) {
                  console.warn(
                    'TikTok iframe NOT injected. embed.js might be blocked or failed.'
                  );
                }
              }, 2000);
            };
            document.body.appendChild(script);
          } else {
            (window as any).tiktok?.embeds?.load?.();

            setTimeout(() => {
              const iframe = el.querySelector('iframe');
              const blockquote = el.querySelector('blockquote');
              console.log('TikTok debug:', {
                iframe,
                blockquote,
                html: el.innerHTML,
              });

              if (!iframe) {
                console.warn(
                  'TikTok iframe NOT injected. embed.js might be blocked or failed.'
                );
              }
            }, 2000);
          }
        });
    });
  }

  isGrouped(index: number): boolean {
    if (index === 0) return true;

    const current = this.filteredMessages[index];
    const previous = this.filteredMessages[index - 1];

    const sameSender = current.sender === previous.sender;
    const sameTime = this.isSameMinute(current, previous);
    const sameReplyStatus = !!current.replyTo === !!previous.replyTo;

    return !(sameSender && sameTime && sameReplyStatus);
  }

  getUser(userId: string): PopulatedUser | undefined {
    return this.members.find((m) => m.user._id === userId);
  }

  getUsername(userId: string): string {
    return (
      this.members.find((m) => m.user._id === userId)?.user.username ??
      'Unknown'
    );
  }

  getAvatarUrl(userId: string): string {
    const avatar = this.members.find((m) => m.user._id === userId)?.user.avatar;
    return avatar
      ? `${this.environment.backendUrl}/${avatar}`
      : 'assets/camera.svg';
  }

  getQuotedText(messageId: string): string {
    return (
      this.replyMessages.find((m) => m._id === messageId)?.text ?? '[deleted]'
    );
  }

  getRecipientUsername(messageId: string): string {
    const sender =
      this.replyMessages.find((m) => m._id === messageId)?.sender ??
      '[deleted]';
    return this.getUsername(sender);
  }

  getRecipientAvatarUrl(messageId: string): string {
    const sender =
      this.replyMessages.find((m) => m._id === messageId)?.sender ??
      '[deleted]';
    return this.getAvatarUrl(sender);
  }

  getMessagePosition(index: number) {
    const current = this.filteredMessages[index];
    const previous = this.filteredMessages[index - 1];
    const next = this.filteredMessages[index + 1];

    const sameSender = (a?: Message, b?: Message) =>
      a && b && a.sender === b.sender;

    const sameMinute = (a?: Message, b?: Message) =>
      a && b && this.isSameMinute(a, b);

    const sameReplyStatus = (a?: Message, b?: Message) =>
      !!a?.replyTo === !!b?.replyTo;

    const isFirstInGroup =
      !sameSender(current, previous) ||
      !sameMinute(current, previous) ||
      !sameReplyStatus(current, previous);

    const isLastInGroup =
      !sameSender(current, next) ||
      !sameMinute(current, next) ||
      !sameReplyStatus(current, next);

    return { isFirstInGroup, isLastInGroup };
  }

  startEditing(msg: Message): void {
    this.editingMessageId = msg._id;
    this.editedText = msg.text;
  }

  cancelEditing(): void {
    this.editingMessageId = null;
    this.editedText = '';
  }

  submitEdit(msg: Message): void {
    const trimmedText = this.editedText.trim();
    if (trimmedText !== msg.text) {
      this.onEdit.emit({ ...msg, text: trimmedText });
    }

    this.cancelEditing();
  }

  scrollToMessage(messageId: string, attempt = 0): void {
    const maxAttempts = 10;

    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('highlighted');
      setTimeout(() => el.classList.remove('highlighted'), 2000);
      return;
    }

    if (attempt >= maxAttempts) {
      console.warn(
        `Message ${messageId} not found after ${maxAttempts} attempts`
      );
      return;
    }

    this.loadOlderMessages.emit();

    setTimeout(() => this.scrollToMessage(messageId, attempt + 1), 300);
  }

  openUserDialog(member: PopulatedUser | undefined) {
    this.dialog.open(UserCardDialogComponent, {
      data: {
        selectedUser: member,
        currentUserId: this.currentUserId,
        chatId: this.chatId,
        isAdmin: this.isAdmin,
        isOwner: this.isOwner,
        isModerator: this.isModerator,
        chatRoomRoles: this.chatRoomRoles,
        currentUserRoles: this.currentUserRoles,
        currentUserFriends: this.currentUserFriends,
        currentUserBanList: this.currentUserBanList,
        currentUserPendingRequests: this.currentUserPendingRequests,
      },
      width: '400px',
    });
  }

  isNotEmpty(arr: Message[]) {
    return arr?.length !== 0;
  }

  trimText(text: string, max: number): string {
    if (!text) return '';
    const trimmed = text.slice(0, max).trim();
    if (trimmed.length === text.length) return trimmed;
    return trimmed.replace(/\.+$/, '') + '...';
  }

  onCopy(text: string) {
    this.isCopied = true;

    navigator.clipboard.writeText(text);

    setTimeout(() => {
      this.isCopied = false;
    }, 2000);
  }

  showPickerFor(messageId: string) {
    this.activeReactionMessageId =
      this.activeReactionMessageId === messageId ? null : messageId;
  }

  toggleReaction(event: any, messageId: string) {
    const emoji = event?.emoji?.native || event?.emoji;

    const key = `${messageId}-${emoji}`;
    this.animatingReactions.add(key);

    const message = this.messages.find((msg) => msg._id === messageId);
    const reaction = message?.reactions.find((r) => r.emoji === emoji);
    const reacted = reaction?.users.includes(this.currentUserId!);

    if (reaction) {
      const newCount = reacted
        ? reaction.users.length - 1
        : reaction.users.length + 1;
      this.tempReactionCounts.set(key, newCount);
    }

    this.wsService.emit(
      'toggleReaction',
      {
        chatId: this.chatId,
        messageId,
        reaction: emoji,
      },
      (res) => {
        if (res?.error) {
          this._snackbar.open(
            res.error.message || 'Failed to toggle reaction',
            'Close',
            { duration: 3000 }
          );
        } else {
          this.animatingReactions.delete(key);
          this.tempReactionCounts.delete(key);
        }
      }
    );
    this.activeReactionMessageId = null;
  }

  reactionTrackFn(index: number, reaction: Reaction) {
    return `${reaction.emoji}-${index}`;
  }

  reactedByUsers(userIds: string[]) {
    return this.members
      .filter((m) => userIds.includes(m.user._id))
      .map((m) => m.user.username)
      .join(', ');
  }
}
