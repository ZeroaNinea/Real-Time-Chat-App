import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { Chat } from '../../models/chat.model';
import { Channel } from '../../models/channel.model';
import { environment } from '../../../../../environments/environment';

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

  getChatRoom(id: string) {
    return this.http.get<Chat>(`${environment.backendUrl}/chat/${id}`);
  }

  updateChatRoom(id: string, data: { name: string }) {
    return this.http.patch<Chat>(`${environment.backendUrl}/chat/${id}`, data);
  }

  addChannel(chatId: string, channelName: string): Observable<Channel> {
    return this.http.post<Channel>(
      `${environment.backendUrl}/chat/add-channel/${chatId}`,
      {
        channelName,
      }
    );
  }

  deleteChatRoom(chatId: string): Observable<void> {
    return this.http.delete<void>(`${environment.backendUrl}/chat/${chatId}`);
  }
}
