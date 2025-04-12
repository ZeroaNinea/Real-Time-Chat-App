import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  constructor() {}

  register(data: { username: string; password: string; email: string }) {
    return this.http.post('http://localhost:5000/auth/register', data);
  }

  login(data: { username: string; password: string }) {
    return this.http.post('http://localhost:5000/auth/login', data);
  }
}
