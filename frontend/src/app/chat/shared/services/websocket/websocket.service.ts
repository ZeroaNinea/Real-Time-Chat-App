import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../../../../environments/environment';
import { Channel } from '../../models/channel.model';
import { Message } from '../../models/message.model';
import { AbbreviatedPopulatedUser } from '../../models/populated-user.model';
import { Member } from '../../models/member.alias';
import { Chat } from '../../models/chat.model';
import { PopulatedNotification } from '../../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
  private socket!: Socket;
  private isConnected = false;
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
    this.socket?.emit(eventName, data, callback);
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

  sendMessage(message: string, chatId: string, channelId: string) {
    if (!this.isConnected) {
      console.warn('Socket is not connected. Cannot send message.');
      return;
    }
    console.log('Sending:', message);
    this.socket.emit('message', { message, chatId, channelId });
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

  listenChannelUpdates(): Observable<Channel[]> {
    return new Observable((observer) => {
      this.socket.on('channelsUpdated', (updatedChannels: Channel[]) => {
        observer.next(updatedChannels);
      });
    });
  }

  listenChannelAdditions(): Observable<Channel> {
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

  listenNewMessage(): Observable<Message> {
    return new Observable((observer) => {
      this.socket.on('message', (message: Message) => {
        observer.next(message);
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

  listenMessageDeletions(): Observable<{ messageId: string }> {
    return new Observable((observer) => {
      this.socket.on('messageDeleted', (data) => {
        observer.next(data);
      });
    });
  }

  listenChannelMessageDeletions(): Observable<{ channelId: string }> {
    return new Observable((observer) => {
      this.socket.on('channelMessagesDeleted', (data) => {
        observer.next(data);
      });
    });
  }

  listenMessageEdits(): Observable<Message> {
    return new Observable((observer) => {
      this.socket.on('messageEdited', (data) => {
        observer.next(data);
      });
    });
  }

  listenMessageReplies(): Observable<Message> {
    return new Observable((observer) => {
      this.socket.on('messageReplied', (data) => {
        observer.next(data);
      });
    });
  }

  listenUserUpdates(): Observable<AbbreviatedPopulatedUser> {
    return new Observable((observer) => {
      this.socket.on('userUpdated', (data) => {
        observer.next(data);
      });
    });
  }

  listenMemberUpdates(): Observable<Member> {
    return new Observable((observer) => {
      this.socket.on('memberUpdated', (data) => {
        observer.next(data);
      });
    });
  }

  listenChatUpdates(): Observable<Chat> {
    return new Observable((observer) => {
      this.socket.on('chatUpdated', (data) => {
        observer.next(data);
      });
    });
  }

  listenChatRoomLeft(): Observable<Chat> {
    return new Observable((observer) => {
      this.socket.on('chatLeft', (data) => {
        observer.next(data);
      });
    });
  }

  listenNotifications(): Observable<PopulatedNotification> {
    return new Observable((observer) => {
      this.socket.on('notification', (data) => {
        observer.next(data);
      });
    });
  }

  listenNotificationDeletions(): Observable<{ notificationId: string }> {
    return new Observable((observer) => {
      this.socket.on('notificationDeleted', (data) => {
        observer.next(data);
      });
    });
  }

  listenFriendAdditions(): Observable<AbbreviatedPopulatedUser> {
    return new Observable((observer) => {
      this.socket.on('friendAdded', (data) => {
        observer.next(data);
      });
    });
  }

  listenFriendAdditionsByOthers(): Observable<AbbreviatedPopulatedUser> {
    return new Observable((observer) => {
      this.socket.on('friendAddedByOther', (data) => {
        observer.next(data);
      });
    });
  }

  listenFriendRemovings(): Observable<{ friendId: string }> {
    return new Observable((observer) => {
      this.socket.on('friendRemoved', (data) => {
        observer.next(data);
      });
    });
  }

  listenFriendRemovesByOthers(): Observable<{ userId: string }> {
    return new Observable((observer) => {
      this.socket.on('friendRemovedByOther', (data) => {
        observer.next(data);
      });
    });
  }

  listenUserBans(): Observable<AbbreviatedPopulatedUser> {
    return new Observable((observer) => {
      this.socket.on('userBanned', (data) => {
        observer.next(data);
      });
    });
  }

  listenUserBansByOther(): Observable<AbbreviatedPopulatedUser> {
    return new Observable((observer) => {
      this.socket.on('userBannedByOther', (data) => {
        observer.next(data);
      });
    });
  }

  listenUserUnbans(): Observable<{ userId: string }> {
    // console.log('Listening for user unbans...');
    return new Observable((observer) => {
      this.socket.on('userUnbanned', (data) => {
        observer.next(data);
      });
    });
  }

  listenUserUnbansByOther(): Observable<{ userId: string }> {
    return new Observable((observer) => {
      this.socket.on('userUnbannedByOther', (data) => {
        observer.next(data);
      });
    });
  }
}
