import {
  afterEveryRender,
  afterNextRender,
  Component,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleService } from './shared/services/idle/idle.service';
import { WebsocketService } from './chat/shared/services/websocket/websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'frontend';
}
