import {
  Component,
  inject,
  signal,
  OnDestroy,
  afterNextRender,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WebsocketService } from '../shared/services/websocket/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnDestroy {
  message = signal('');
  messages = signal<string[]>([]);
  private wsService = inject(WebsocketService);
  private messagesSubscription?: Subscription;

  constructor() {
    afterNextRender(() => {
      this.connectSocketIo();
    });
  }

  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
  }

  sendMessage() {
    if (this.message().trim()) {
      this.wsService.sendMessage(this.message());
      this.message.set('');
    }
  }

  connectSocketIo() {
    if (this.messagesSubscription) return; // Avoid duplicate subscriptions.

    this.wsService.connect(); // Ensure connection happens here.

    this.messagesSubscription = this.wsService
      .getMessages()
      .subscribe((msgs) => {
        this.messages.set(msgs);
      });
  }
}
