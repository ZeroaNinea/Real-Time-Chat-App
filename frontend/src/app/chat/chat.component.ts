import { Component, inject, signal, effect, OnInit, AfterViewInit, runInInjectionContext } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WebsocketService } from '../websocket.service';


@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, AfterViewInit {
  message = signal('');
  messages = signal<string[]>([]);

  private wsService = inject(WebsocketService);

  constructor() {
    console.log('ChatComponent constructor called.');
    // effect(() => {
    // console.log('ChatComponent initialized.');
    //   this.wsService.onMessage((msg: string) => {
    //     console.log('Received message:', msg);
    //     this.messages.set([...this.messages(), msg]);
    //   });
    // });
    /////////////////////////////////////////
    // this.wsService.connect();
    // effect(() => {
    //   this.wsService.onMessage((msg: string) => {
    //     console.log('Received message:', msg);
    //     this.messages.set([...this.messages(), msg]);
    //   });
    // });
    /////////////////////////////////////////
    // this.wsService.onMessage((msg: string) => {
    //   console.log('Received message:', msg);
    //   this.messages.update(messages => [...messages, msg]); // Safer update.
    // });
  }

  // ngOnInit(): void {
  //   console.log('ChatComponent initialized.');
  //   this.wsService.connect();
  //   effect(() => {
  //     this.wsService.onMessage((msg: string) => {
  //       console.log('Received message:', msg);
  //       this.messages.set([...this.messages(), msg]);
  //     });
  //   });
  // }
  ngOnInit(): void {
    console.log('ChatComponent initialized.');
    this.wsService.connect();

    // Ensure we only subscribe once
    this.wsService.onMessage((msg: string) => {
      console.log('Received message:', msg);
      this.messages.update(messages => [...messages, msg]); // Safe update
    });
  }

  ngAfterViewInit(): void {
    console.log('ChatComponent view initialized.');
    // // Delay the WebSocket connection to ensure the component is fully initialized.
    // setTimeout(() => {
    //   this.initializeWebSocketConnection();
    // }, 100);
  }

  // initializeWebSocketConnection() {
  //   this.wsService.connect();
  //   effect(() => {
  //     this.wsService.onMessage((msg: string) => {
  //       console.log('Received message:', msg);
  //       this.messages.set([...this.messages(), msg]);
  //     });
  //   });
  // }
  // initializeWebSocketConnection() {
  //   // `runInInjectionContext` ensures that `effect()` is used correctly.
  //   runInInjectionContext(this.wsService as any, () => {
  //     this.wsService.onMessage((msg: string) => {
  //       console.log('Received message:', msg);
  //       this.messages.update(messages => [...messages, msg]); // safer update
  //     });
  //   });
  // }
  // initializeWebSocketConnection() {
  //   this.wsService.onMessage((msg: string) => {
  //     console.log('Received message:', msg);
  //     this.messages.update(messages => [...messages, msg]); // safer update
  //   });
  // }

  sendMessage() {
    if (this.message().trim()) {
      console.log('Sending message:', this.message());
      this.wsService.sendMessage(this.message());
      this.message.set('');
    }
  }
}
