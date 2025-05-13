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
  private pendingJoins: string[] = [];

  private flushPendingJoins() {
    this.pendingJoins.forEach((chatId) => {
      this.socket.emit('joinChatRoom', { chatId });
    });
    this.pendingJoins = [];
  }

  emit<T = any, R = any>(
    eventName: string,
    data: T,
    callback?: (response: R) => void
  ) {
    if (!this.isConnected) {
      console.warn('Socket is not connected. Cannot emit event.');
      return;
    }
    this.socket?.emit(eventName, data, callback); // ← you missed passing the callback!
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
      this.flushPendingJoins();
      console.log('User connected.');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    // this.socket.on('channelAdded', (channel) => {
    //   console.log('Received new channel:', channel);
    // });

    this.socket.on('message', (message: string) => {
      this.messageSubject.next([...this.messageSubject.getValue(), message]);
    });

    // this.socket.on('roomJoined', ({ chatId }) => {
    //   console.log(`Successfully joined room: ${chatId}`);
    // });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('WebSocket manually disconnected.');
    }
  }

  sendMessage(message: string) {
    if (!this.isConnected) {
      console.warn('Socket is not connected. Cannot send message.');
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
        observer.next(data.channel);
      });
    });
  }

  listenChannelAdditions(): Observable<Channel> {
    console.log('Listening for channel additions...');
    return new Observable((observer) => {
      this.socket.on('channelAdded', (channel: Channel) => {
        observer.next(channel);
      });
    });
  }

  listenChannelDeletions(): Observable<{ channelId: string }> {
    return new Observable((observer) => {
      this.socket.on('channelDeleted', (data) => {
        observer.next(data);
      });
    });
  }

  joinChatRoom(chatId: string) {
    if (!this.isConnected) {
      this.pendingJoins.push(chatId);
      return;
    }
    this.socket.emit('joinChatRoom', { chatId });
  }
}
