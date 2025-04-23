import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Chat } from '../../models/chat.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);

  constructor() {}

  createChatRoom(data: { name: string; channels: string }): Observable<Chat> {
    return this.http.post<Chat>('/chat/create-chat', {
      name: data.name,
      channels: data.channels,
      isPrivate: false,
    });
  }
}
