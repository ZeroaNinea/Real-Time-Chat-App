import { DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Message } from '../../shared/models/message.model';
import { PopulatedUser } from '../../shared/models/populated-user.model';
import { ChatRoomRole } from '../../shared/models/chat-room-roles.alias';

import { environment } from '../../../../environments/environment';
import { UserCardDialogComponent } from '../../dialogs/user-card-dialog/user-card-dialog.component';

@Component({
  selector: 'app-message-list',
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  standalone: true,
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
})
export class MessageListComponent {
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

  @Output() onDelete = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<Message>();
  @Output() onReply = new EventEmitter<Message>();
  @Output() loadOlderMessages = new EventEmitter<void>();

  private dialog = inject(MatDialog);

  private isSameMinute(a: Message, b: Message): boolean {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return Math.abs(timeA - timeB) < 60000;
  }

  get filteredMessages() {
    return this.messages.filter((msg) => msg.channelId === this.channelId);
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
    // const element = document.getElementById(`message-${messageId}`);
    // if (element) {
    //   element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //   element.classList.add('highlighted');
    //   setTimeout(() => element.classList.remove('highlighted'), 2000);
    // }
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

  trimText(text: string, max: number): string {
    if (!text) return '';
    const trimmed = text.slice(0, max).trim();
    if (trimmed.length === text.length) return trimmed;
    return trimmed.replace(/\.+$/, '') + '...';
  }
}
