import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { User } from './shared/user.model';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  constructor() {}

  register(data: { username: string; password: string; email: string }) {
    return this.http.post(`${environment.backendUrl}/auth/register`, data);
  }

  login(data: { username: string; password: string }) {
    return this.http.post(`${environment.backendUrl}/auth/login`, data);
  }

  updateEmail(email: string): Observable<User> {
    return this.http.put<User>(`${environment.backendUrl}/auth/update-email`, {
      email,
    });
  }
}
