import { Component, inject, signal, effect, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { WebsocketService } from './websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';

  // message!: string;
  // messages: string[] = [];

  // constructor(private chatService: WebsocketService) { }

  // ngOnInit() {
  //   this.chatService.getMessages().subscribe((message: any) => {
  //     this.messages.push(message);
  //   });
  // }

  // sendMessage() {
  //   this.chatService.sendMessage(this.message);
  //   this.message = '';
  // }

  message = signal('');
  messages: WritableSignal<string[]> = signal<string[]>([]);

  private wsService = inject(WebsocketService);

  constructor() {
    effect(() => {
      this.wsService.onMessage((msg) => {
        this.messages.set([...this.messages(), msg]);
      });
    });
    // this.wsService.onMessage((msg) => {
    //   this.messages.set([...this.messages(), msg]);
    // });
  }

  sendMessage() {
    if (this.message().trim()) {
      this.wsService.sendMessage(this.message());
      this.message.set('');
    }
  }
}
