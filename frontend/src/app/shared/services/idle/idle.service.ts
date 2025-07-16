import {
  afterEveryRender,
  inject,
  Injectable,
  OnInit,
  signal,
} from '@angular/core';
import { WebsocketService } from '../../../chat/shared/services/websocket/websocket.service';

@Injectable({ providedIn: 'root' })
export class IdleService implements OnInit {
  private wsService = inject(WebsocketService);

  private timeout: any;
  private idleDelay = 1000;
  private isIdle = false;

  idleUsers = signal<string[]>([]);

  ngOnInit() {
    this.wsService.listenUserActive().subscribe((userId) => {
      console.log('User is active.', userId);

      this.idleUsers.update((users) => users.filter((u) => u !== userId));
      console.log('Idle users:', this.idleUsers());
    });

    this.wsService.listenUserIdle().subscribe((userId) => {
      console.log('User is idle.', userId);

      this.idleUsers.update((users) => [...users, userId]);
      console.log('Idle users:', this.idleUsers());
    });
  }

  init(wsService: WebsocketService) {
    const resetIdleTimer = () => {
      console.log(this.idleUsers());
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
