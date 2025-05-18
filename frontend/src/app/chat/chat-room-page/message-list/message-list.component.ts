import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Message } from '../../shared/models/message.model';
import { PopulatedUser } from '../../shared/models/populated-user.model';

import { environment } from '../../../../environments/environment';

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

  @Input() currentUserId!: string;

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
