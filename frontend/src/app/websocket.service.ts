import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
// import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  // private socket = io('http://localhost:3000');

  // sendMessage(message: string){
  //   this.socket.emit('new-message', message);
  // }

  // getMessages() {
  //   let observable = new Observable<{ user: String, message: String }>(observer => {
  //     this.socket.on('new-message', (data) => {
  //       observer.next(data);
  //     });
  //     return () => { this.socket.disconnect(); };
  //   });
  //   return observable;
  // }

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'], // Ensure WebSocket transport is used.
    });
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
