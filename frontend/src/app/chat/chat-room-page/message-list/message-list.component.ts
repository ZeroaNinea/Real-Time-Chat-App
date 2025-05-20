import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Message } from '../../shared/models/message.model';
import { PopulatedUser } from '../../shared/models/populated-user.model';

import { environment } from '../../../../environments/environment';

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
  environment = environment;

  hoveredMessageId: string | null = null;
  editingMessageId: string | null = null;
  editedText: string = '';

  @Input() currentUserId!: string | undefined;
  @Input() channelId!: string | null;

  @Output() onDelete = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<Message>();
  @Output() onReply = new EventEmitter<Message>();

  replyToMessage: Message | null = null;

  private isSameMinute(a: Message, b: Message): boolean {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return Math.abs(timeA - timeB) < 60000;
  }

  get filteredMessages() {
    return this.messages.filter((msg) => msg.channelId === this.channelId);
  }

  isGrouped(index: number): boolean {
    const current = this.filteredMessages[index];
    const previous = this.filteredMessages[index - 1];

    return (
      index === 0 ||
      current.sender !== previous.sender ||
      !this.isSameMinute(current, previous)
    );
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

  getMessagePosition(index: number) {
    const current = this.filteredMessages[index];
    const previous = this.filteredMessages[index - 1];
    const next = this.filteredMessages[index + 1];

    const sameSender = (a?: Message, b?: Message) =>
      a && b && a.sender === b.sender;

    const sameMinute = (a?: Message, b?: Message) =>
      a && b && this.isSameMinute(a, b);

    const isFirstInGroup =
      !sameSender(current, previous) || !sameMinute(current, previous);

    const isLastInGroup =
      !sameSender(current, next) || !sameMinute(current, next);

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

  startReplying(message: Message): void {
    this.replyToMessage = message;
  }

  cancelReply(): void {
    this.replyToMessage = null;
  }

  sendReply(text: string): void {
    if (!this.replyToMessage) return;

    // this.websocketService.emit('reply', {
    //   messageId: this.replyToMessage._id,
    //   text,
    // }, (res) => {
    //   if (res?.error) {
    //     console.error(res.error);
    //     return;
    //   }

    this.replyToMessage = null;
  }
}
