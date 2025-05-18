import { DatePipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Message } from '../../shared/models/message.model';
import { PopulatedUser } from '../../shared/models/populated-user.model';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-message-list',
  imports: [DatePipe, MatIconModule, MatButtonModule],
  standalone: true,
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
})
export class MessageListComponent {
  @Input() messages!: Message[];
  @Input() members!: PopulatedUser[];
  environment = environment;

  hoveredMessageId: string | null = null;

  @Input() currentUserId!: string | undefined;
  @Input() channelId!: string | null;

  private isSameMinute(a: Message, b: Message): boolean {
    return (
      Math.abs(
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ) < 60000
    );
  }

  get filteredMessages() {
    return this.messages.filter((msg) => msg.channelId === this.channelId);
  }

  isGrouped(i: number): boolean {
    return (
      i > 0 &&
      this.filteredMessages[i].sender === this.filteredMessages[i - 1].sender &&
      this.isSameMinute(this.filteredMessages[i], this.filteredMessages[i - 1])
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

  onReply(msg: Message): void {
    // Emit or set state to trigger reply.
  }

  onEdit(msg: Message): void {
    // Trigger edit UI.
  }

  onDelete(msg: Message): void {
    // Emit delete event or call delete service.
  }
}
