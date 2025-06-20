import { Component, inject, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';

import { Router } from 'express';

import { PrivateChatRoom } from '../../shared/models/private-chat-room.model';
import { ChatService } from '../../shared/services/chat-service/chat.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-private-friend-list',
  imports: [MatListModule],
  standalone: true,
  templateUrl: './private-friend-list.component.html',
  styleUrl: './private-friend-list.component.scss',
})
export class PrivateFriendListComponent {
  @Input() privateChatRooms: PrivateChatRoom[] = [];

  private chatService = inject(ChatService);
  private router = inject(Router);

  environment = environment;

  message(targetUserId: string) {
    console.log(targetUserId);
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
