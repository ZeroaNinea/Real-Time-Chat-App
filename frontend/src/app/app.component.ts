import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { WebsocketService } from './websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';

  message = '';
  messages: string[] = [];

  constructor(private wsService: WebsocketService) {
    this.wsService.onMessage((msg) => this.messages.push(msg));
  }

  sendMessage() {
      if (this.message.trim()) {
          this.wsService.sendMessage(this.message);
          this.message = '';
      }
  }
}
