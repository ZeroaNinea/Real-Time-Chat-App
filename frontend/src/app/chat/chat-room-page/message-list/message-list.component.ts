import { DatePipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';

import { Message } from '../../shared/models/message.model';
import { PopulatedUser } from '../../shared/models/populated-user.model';

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
  ],
  standalone: true,
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
})
export class MessageListComponent {
  @Input() messages!: Message[];
  @Input() members!: PopulatedUser[];
  @Input() isAdmin: boolean = false;
  @Input() isOwner: boolean = false;
  @Input() isModerator: boolean = false;
  environment = environment;

  hoveredMessageId: string | null = null;
  editingMessageId: string | null = null;
  editedText: string = '';

  @Input() currentUserId!: string | undefined;
  @Input() channelId!: string | null;

  @Output() onDelete = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<Message>();
  @Output() onReply = new EventEmitter<Message>();

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
    return this.messages.find((m) => m._id === messageId)?.text ?? '[deleted]';
  }

  getRecipientUsername(messageId: string): string {
    const sender =
      this.messages.find((m) => m._id === messageId)?.sender ?? '[deleted]';
    return this.getUsername(sender);
  }

  getRecipientAvatarUrl(messageId: string): string {
    const sender =
      this.messages.find((m) => m._id === messageId)?.sender ?? '[deleted]';
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

  scrollToMessage(messageId: string): void {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('highlighted');
      setTimeout(() => element.classList.remove('highlighted'), 2000);
    }
  }

  openUserDialog(member: PopulatedUser | undefined) {
    this.dialog.open(UserCardDialogComponent, {
      data: { selectedUser: member, currentUserId: this.currentUserId },
      // width: '400px',
    });
  }

  trimText(text: string, max: number): string {
    if (!text) return '';
    const trimmed = text.slice(0, max).trim();
    if (trimmed.length === text.length) return trimmed;
    return trimmed.replace(/\.+$/, '') + '...';
  }
}
