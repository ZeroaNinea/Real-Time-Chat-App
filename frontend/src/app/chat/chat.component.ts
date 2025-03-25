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
      console.log('ChatComponent initialized.');
      this.wsService.onMessage((msg: string) => {
        console.log('Received message:', msg);
        this.messages.set([...this.messages(), msg]);
      });
    });
  }

  sendMessage() {
    if (this.message().trim()) {
      console.log('Sending message:', this.message());
      this.wsService.sendMessage(this.message());
      this.message.set('');
    }
  }
}
