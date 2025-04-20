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

  constructor() {
    // this.http
    //   .put('http://localhost:5000/auth/update-email', {
    //     email: 'another@example.com',
    //   })
    //   .subscribe({ next: console.log, error: console.error });
  }

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

  updateUsernameBio(data: { username: string; bio: string }) {
    return this.http.put<User>(
      `${environment.backendUrl}/auth/update-username-bio`,
      data
    );
  }

  updatePassword(data: { currentPassword: string; newPassword: string }) {
    return this.http.put<User>(
      `${environment.backendUrl}/auth/update-password`,
      data
    );
  }

  uploadAvatar(data: FormData) {
    return this.http.post<{ avatar: string }>(
      `${environment.backendUrl}/auth/update-avatar`,
      data
    );
  }

  removeAvatar(): Observable<void> {
    return this.http.delete<void>(
      `${environment.backendUrl}/auth/remove-avatar`
    );
  }

  deleteAccount(data: { password: string }) {
    return this.http.delete(`${environment.backendUrl}/auth/delete-account`, {
      body: data,
    });
  }

  updatePronouns(pronouns: string) {
    return this.http.put<User>(
      `${environment.backendUrl}/auth/update-pronouns`,
      {
        pronouns,
      }
    );
  }
}
