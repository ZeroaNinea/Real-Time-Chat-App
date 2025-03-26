import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket!: Socket;
  private isConnected = false;
  private messageSubject = new BehaviorSubject<string[]>([]);

  constructor() {}

  connect() {
    if (this.socket && this.isConnected) {
      console.log('Already connected.');
      return;
    }

    this.socket = io("http://localhost:3000", { transports: ['websocket'] });

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
    });

    this.socket.on('message', (message: string) => {
      console.log("Received message:", message);
      this.messageSubject.next([...this.messageSubject.getValue(), message]);
    });
  }

  sendMessage(message: string) {
    if (!this.isConnected) {
      console.warn("Cannot send message: Socket is not connected.");
      return;
    }
    this.socket.emit('message', message);
  }

  getMessages() {
    return this.messageSubject.asObservable();
  }

  ngOnDestroy() {
    console.log('WebsocketService destroyed. Disconnecting socket.');
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}
