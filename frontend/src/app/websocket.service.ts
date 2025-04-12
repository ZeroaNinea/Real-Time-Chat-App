import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import config from '../../../backend/src/config/env';
const { PORT } = config;

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private socket!: Socket;
  private isConnected = false;
  private messageSubject = new BehaviorSubject<string[]>([]);

  constructor() {}

  connect() {
    if (this.socket && this.isConnected) return;

    this.socket = io(`http://localhost:${PORT}`, { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.isConnected = true;

      console.log('User connected.');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('message', (message: string) => {
      this.messageSubject.next([...this.messageSubject.getValue(), message]);
    });
  }

  sendMessage(message: string) {
    if (!this.isConnected) {
      return;
    }
    console.log('Sending:', message);
    this.socket.emit('message', message);
  }

  getMessages() {
    console.log('Getting messages...');
    return this.messageSubject.asObservable();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('User disconnected.');
    }
  }
}
