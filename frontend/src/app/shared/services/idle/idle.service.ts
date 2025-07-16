import { Injectable } from '@angular/core';
import { WebsocketService } from '../../../chat/shared/services/websocket/websocket.service';

@Injectable({ providedIn: 'root' })
export class IdleService {
  private timeout: any;
  private idleDelay = 60000;
  private isIdle = false;

  init(wsService: WebsocketService) {
    wsService.connect();

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
