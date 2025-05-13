import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { Chat } from '../../models/chat.model';
import { Channel } from '../../models/channel.model';
import { environment } from '../../../../../environments/environment';
import { Member } from '../../models/member.aliase';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);

  constructor() {}

  createChatRoom(data: { name: string }) {
    return this.http.post<Chat>(
      `${environment.backendUrl}/chat/create-chat`,
      data
    );
  }

  getChatRoom(chatId: string) {
    return this.http.get<{
      name: string;
      members: Member[];
      channels: Channel[];
    }>(`${environment.backendUrl}/chat/${chatId}`);
  }

  updateChatRoom(id: string, data: { name: string }) {
    return this.http.patch<Chat>(
      `${environment.backendUrl}/chat/update-chat/${id}`,
      data
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

  // deleteChannel(chatId: string, channelId: string): Observable<void> {
  //   return this.http.delete<void>(
  //     `${environment.backendUrl}/chat/delete-channel/${channelId}`
  //   );
  // }
}
