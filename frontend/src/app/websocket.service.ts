import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket!: Socket;
  private isConnected = false;
  private messageSubject = new BehaviorSubject<string | null>(null);

  constructor() {}

  connect() {
    if (this.isConnected) {
      console.log('Already connected.');
      return
    };
    this.socket = io("http://localhost:3000", { transports: ['websocket'] });
    this.isConnected = true;

    this.socket.on("connect", () => console.log("Connected to server"));
    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
    });

    this.socket.on('message', (message: string) => {
      console.log("Received message:", message);
      this.messageSubject.next(message);
    });
  }

  sendMessage(message: string) {
    if (!this.isConnected) return;
    this.socket.emit('message', message);
  }

  onMessage(callback: (message: string) => void) {
    // this.socket.on('message', callback);
    this.messageSubject.subscribe(message => {
      if (message) callback(message);
    });
  }

  ngOnDestroy() {
    console.log('WebsocketService destroyed. Disconnecting socket.');
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}
