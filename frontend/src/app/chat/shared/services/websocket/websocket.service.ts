import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../../../environments/environment';
import { Channel } from '../../models/channel.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private socket!: Socket;
  private isConnected = false;
  private messageSubject = new BehaviorSubject<string[]>([]);

  emit<T = any>(eventName: string, data: T) {
    this.socket?.emit(eventName, data);
  }

  on<T = any>(eventName: string, callback: (data: T) => void) {
    this.socket?.on(eventName, callback);
  }

  off(eventName: string) {
    this.socket?.off(eventName);
  }

  connect() {
    if (this.socket && this.isConnected) return;

    const token = localStorage.getItem('accessToken');

    this.socket = io(environment.backendUrl, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    this.socket.on('connect', () => {
      this.isConnected = true;

      console.log(
        'Socket.IO connection established:',
        this.socket.id,
        'websocket.service.ts'
      );
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

  listen<T = any>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });
    });
  }

  listenChannelUpdates(): Observable<Channel> {
    return new Observable((observer) => {
      this.socket.on('channelEdited', (data: { channel: Channel }) => {
        console.log('Channel edited:', data);
        observer.next(data.channel);
      });
    });
  }

  // listenChannelAdditions(): Observable<Channel> {
  //   return new Observable((observer) => {
  //     this.socket.on('channelAdded', (data: { channel: Channel }) => {
  //       console.log('Channel added:', data);
  //       observer.next(data.channel);
  //     });
  //   });
  // }
  listenChannelAdditions(): Observable<Channel> {
    return new Observable((observer) => {
      this.socket.on('channelAdded', (channel: Channel) => {
        console.log('Channel added:', channel, '`websocket.service.ts`');
        observer.next(channel);
      });
    });
  }

  joinChatRoom(chatId: string) {
    if (!this.isConnected) return;
    this.socket.emit('joinChatRoom', { chatId });
  }
}
