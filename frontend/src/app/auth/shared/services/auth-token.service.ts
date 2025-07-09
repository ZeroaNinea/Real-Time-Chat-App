import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('accessToken');
  }
}
