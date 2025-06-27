import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { BehaviorSubject, Observable, tap } from 'rxjs';

import { Chat } from '../../models/chat.model';
import { Channel } from '../../models/channel.model';
import { environment } from '../../../../../environments/environment';
import { Member } from '../../models/member.alias';
import { Message } from '../../models/message.model';
import {
  AbbreviatedPopulatedUser,
  PopulatedUser,
} from '../../models/populated-user.model';
import { ChatRoomRole } from '../../models/chat-room-roles.alias';
import { ChatRooms } from '../../models/chat-rooms.interface';
import { PopulatedNotification } from '../../models/notification.model';
import { PrivateChatRoom } from '../../models/private-chat-room.model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private favorites$ = new BehaviorSubject<string[]>([]);

  constructor() {}

  createChatRoom(data: FormData) {
    return this.http.post<Chat>(
      `${environment.backendUrl}/chat/create-chat`,
      data
    );
  }

  getChatRoom(chatId: string) {
    return this.http.get<{
      name: string;
      topic: string;
      thumbnail: string;
      isPrivate: boolean;
      members: Member[];
      channels: Channel[];
      chatRoles: ChatRoomRole[];
    }>(`${environment.backendUrl}/chat/${chatId}`);
  }

  getChatMembers(chatId: string) {
    return this.http.get<PopulatedUser[]>(
      `${environment.backendUrl}/chat/${chatId}/members`
    );
  }

  updateChatRoom(id: string, data: FormData) {
    return this.http.patch<Chat>(
      `${environment.backendUrl}/chat/update-chat/${id}`,
      data
    );
  }

  deleteThumbnail(chatId: string) {
    return this.http.delete(
      `${environment.backendUrl}/chat/delete-thumbnail/${chatId}`
    );
  }

  addChannel(chatId: string, channelName: string): Observable<Channel> {
    console.log('Adding channel:', channelName);
    return this.http.post<Channel>(
      `${environment.backendUrl}/chat/add-channel/${chatId}`,
      {
        channelName,
      }
    );
  }

  updateChannel(channelId: string, changes: Partial<Channel>): Observable<any> {
    return this.http.patch(`/chat/update-channel/${channelId}`, changes);
  }

  deleteChatRoom(chatId: string): Observable<void> {
    return this.http.delete<void>(`${environment.backendUrl}/chat/${chatId}`);
  }

  // getMessages(chatId: string, channelId: string): Observable<Message[]> {
  //   return this.http.get<Message[]>(
  //     `${environment.backendUrl}/message/get-messages/chat-room/${chatId}/channel/${channelId}`
  //   );
  // }
  getMessages(
    chatId: string,
    channelId: string,
    limit = 20,
    before?: string
  ): Observable<Message[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (before) {
      params = params.set('before', before);
    }

    return this.http.get<Message[]>(
      `${environment.backendUrl}/message/get-messages/chat-room/${chatId}/channel/${channelId}`,
      { params }
    );
  }

  getPrivateMessages(
    chatId: string,
    limit = 20,
    before?: string
  ): Observable<Message[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (before) {
      params = params.set('before', before);
    }

    return this.http.get<Message[]>(
      `${environment.backendUrl}/message/get-private-messages/${chatId}`,
      { params }
    );
  }

  getReplyMessages(
    chatId: string,
    channelId: string,
    replyToIds: string[]
  ): Observable<Message[]> {
    return this.http.post<Message[]>(
      `${environment.backendUrl}/message/get-reply-messages/chat-room/${chatId}/channel/${channelId}`,
      { replyToIds }
    );
  }

  getPrivateReplyMessages(
    chatId: string,
    replyToIds: string[]
  ): Observable<Message[]> {
    return this.http.post<Message[]>(
      `${environment.backendUrl}/message/get-private-reply-messages/${chatId}`,
      { replyToIds }
    );
  }

  getChatRooms(
    page: number | string,
    limit: number | string
  ): Observable<ChatRooms> {
    return this.http.get<ChatRooms>(
      `${environment.backendUrl}/chat/get-chat-rooms`,
      {
        params: {
          page: page.toString(),
          limit: limit.toString(),
        },
      }
    );
  }

  getNotifications() {
    return this.http.get<PopulatedNotification[]>(
      `${environment.backendUrl}/notification/get-notifications`
    );
  }

  getFriends() {
    return this.http.get<AbbreviatedPopulatedUser[]>(
      `${environment.backendUrl}/social/get-friends`
    );
  }

  getBanList() {
    return this.http.get<AbbreviatedPopulatedUser[]>(
      `${environment.backendUrl}/social/get-ban-list`
    );
  }

  getOrCreatePrivateChat(targetUserId: string) {
    return this.http.post<{ _id: string }>(
      `${environment.backendUrl}/chat/private/${targetUserId}`,
      {}
    );
  }

  getPrivateChatRooms() {
    return this.http.get<PrivateChatRoom[]>(
      `${environment.backendUrl}/chat/private/get-private-chat-rooms`
    );
  }

  getFavorites() {
    return this.http
      .get<string[]>(`${environment.backendUrl}/favorites/get-favorites`)
      .pipe(
        tap((favs) => {
          this.favorites$.next(favs);
        })
      );
  }

  addFavorite(gifUrl: string) {
    return this.http
      .post<string[]>(`${environment.backendUrl}/favorites/add-favorite`, {
        gifUrl,
      })
      .pipe(
        tap((favs) => {
          this.favorites$.next(favs);
        })
      );
  }
}
