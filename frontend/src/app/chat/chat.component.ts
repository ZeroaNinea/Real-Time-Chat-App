import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WebsocketService } from '../websocket.service';


@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  message = signal('');
  messages = signal<string[]>([]);

  private wsService = inject(WebsocketService);

  constructor() {
    effect(() => {
      this.wsService.onMessage((msg: string) => {
        this.messages.set([...this.messages(), msg]);
      });
    });
  }

  sendMessage() {
    if (this.message().trim()) {
      this.wsService.sendMessage(this.message());
      this.message.set('');
    }
  }
}
