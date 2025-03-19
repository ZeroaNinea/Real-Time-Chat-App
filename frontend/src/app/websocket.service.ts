import { Injectable } from '@angular/core';
import {io} from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket = io('http://localhost:3000');

  constructor() { }

  sendMessage(message: string) {
    this.socket.emit('message', message);
  }

  onMessage(callback: (message: string) => void) {
    this.socket.on('message', callback);
}
}
