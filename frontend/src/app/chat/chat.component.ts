import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WebsocketService } from '../websocket.service';


@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  message = signal('');
  messages = signal<string[]>([]);

  private wsService = inject(WebsocketService);

  constructor() {
    console.log('ChatComponent constructor called.');
  }

  ngOnInit(): void {
    setTimeout(() => {
      console.log('ChatComponent initialized.');
      this.wsService.connect();

      // Ensure we only subscribe once.
      this.wsService.onMessage((msg: string) => {
        console.log('Received message:', msg);
        this.messages.update(messages => [...messages, msg]); // Safe update.
      });
    }, 100);
  }

  connectSocketIo() {
    console.log('ChatComponent initialized.');
    this.wsService.connect();

    // Ensure we only subscribe once
    this.wsService.onMessage((msg: string) => {
      console.log('Received message:', msg);
      this.messages.update(messages => [...messages, msg]); // Safe update.
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
