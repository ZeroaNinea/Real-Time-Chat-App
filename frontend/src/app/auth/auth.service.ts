import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { User } from './shared/user.model';
import { environment } from '../../environments/environment';
import { consumerPollProducersForChange } from '@angular/core/primitives/signals';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  constructor() {
    // this.http
    //   .put('http://localhost:5000/auth/update-email', {
    //     email: 'another@example.com',
    //   })
    //   .subscribe({ next: console.log, error: console.error });
    // this.fetchUser();
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

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.backendUrl}/auth/logout`, {})
      .pipe(tap(() => this.fetchUser()));
  }

  fetchUser() {
    this.http.get<User>(`${environment.backendUrl}/auth/account`).subscribe({
      next: (user) => {
        console.log('Fetched user:', user, '====================');
        this.currentUser.set(user);
      },
      error: (err) => console.error('Failed to fetch user', err),
    });
  }
}
