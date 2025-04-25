import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Chat } from '../../models/chat.model';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);

  constructor() {}

  createChatRoom(data: { name: string; channels: string }): Observable<Chat> {
    return this.http.post<Chat>(`${environment.backendUrl}/chat/create-chat`, {
      name: data.name,
      channels: data.channels,
      isPrivate: false,
    });
  }

  addChannel(data: { chatId: string; channelName: string }) {
    return this.http.post(`${environment.backendUrl}/chat/add-chennel`, data);
  }

  deleteChatRoom(chatId: string): Observable<void> {
    return this.http.delete<void>(`${environment.backendUrl}/chat/${chatId}`);
  }
}
