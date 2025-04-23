import {
  afterNextRender,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { WebsocketService } from '../../shared/services/websocket/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  imports: [],
  standalone: true,
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnDestroy {
  message = signal('');
  messages = signal<string[]>([]);
  private wsService = inject(WebsocketService);
  private sub?: Subscription;

  constructor() {
    afterNextRender(() => this.connect());
  }

  connect() {
    this.wsService.connect();
    this.sub = this.wsService.getMessages().subscribe((msgs) => {
      this.messages.set(msgs);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
