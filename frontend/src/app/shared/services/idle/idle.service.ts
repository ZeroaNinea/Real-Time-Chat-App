import { inject, Injectable, signal } from '@angular/core';
import { WebsocketService } from '../../../chat/shared/services/websocket/websocket.service';

@Injectable({ providedIn: 'root' })
export class IdleService {
  private wsService = inject(WebsocketService);

  private timeout: any;
  private idleDelay = 60000;
  private isIdle = false;

  idleUsers = signal<string[]>([]);

  init(wsService: WebsocketService) {
    this.wsService.listenUserActive().subscribe((userId) => {
      this.idleUsers.update((users) => users.filter((u) => u !== userId));
    });

    this.wsService.listenUserIdle().subscribe((userId) => {
      this.idleUsers.update((users) => [...users, userId]);
    });

    const resetIdleTimer = () => {
      if (this.isIdle) {
        wsService.emitUserActive();
        this.isIdle = false;
      }

      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        wsService.emitUserIdle();
        this.isIdle = true;
      }, this.idleDelay);
    };

    ['mousemove', 'keydown', 'click', 'scroll'].forEach((event) =>
      window.addEventListener(event, resetIdleTimer)
    );

    resetIdleTimer();
  }
}
