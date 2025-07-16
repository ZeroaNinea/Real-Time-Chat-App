import { Injectable } from '@angular/core';
import { WebsocketService } from '../../../chat/shared/services/websocket/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class IdleService {
  constructor() {}

  private timeout: any;
  private delay = 60000;

  init(wsService: WebsocketService) {
    const reset = () => {
      clearTimeout(this.timeout);
      wsService.emitUserActive();
      this.timeout = setTimeout(() => {
        wsService.emitUserIdle();
      }, this.delay);
    };

    ['mousemove', 'keydown', 'click', 'scroll'].forEach((event) =>
      window.addEventListener(event, reset)
    );

    reset();
  }
}
