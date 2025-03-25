import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
    this.socket = io("http://localhost:3000", {
      transports: ['websocket'], // Ensure WebSocket transport is used.
    });
    this.socket.on("error", (error) => console.error('Socket.io error:', error));
    this.socket.on("connect", () => console.log("Connected to server"));
    this.socket.on("disconnect", () => console.log("Disconnected from server"));
  }

  sendMessage(message: string) {
    this.socket.emit('message', message);
  }

  onMessage(callback: (message: string) => void) {
    this.socket.on('message', callback);
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
