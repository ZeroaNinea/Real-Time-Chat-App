import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';

import { PrivateChatRoom } from '../../shared/models/private-chat-room.model';

import { ChatService } from '../../shared/services/chat-service/chat.service';
import { IdleService } from '../../../shared/services/idle/idle.service';

import { environment } from '../../../../environments/environment';

import { StatusDotComponent } from '../../shared/components/status-dot/status-dot.component';

@Component({
  selector: 'app-private-friend-list',
  imports: [MatListModule, StatusDotComponent],
  standalone: true,
  templateUrl: './private-friend-list.component.html',
  styleUrl: './private-friend-list.component.scss',
})
export class PrivateFriendListComponent {
  @Input() privateChatRooms: PrivateChatRoom[] = [];
  @Input() onlineUsers: Set<string> = new Set();
  @Input() typingUsers: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();

  private chatService = inject(ChatService);
  private router = inject(Router);

  environment = environment;

  idleService = inject(IdleService);

  message(targetUserId: string) {
    this.chatService.getOrCreatePrivateChat(targetUserId).subscribe((res) => {
      this.router.navigate(['/chat-room', res._id]);
    });
  }

  getAvatarUrl(userAvatar: string) {
    return userAvatar
      ? `${this.environment.backendUrl}/${userAvatar}`
      : 'assets/camera.svg';
  }
}
