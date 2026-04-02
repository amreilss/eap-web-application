import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  setAccessToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setRefreshToken(token: string) {
    localStorage.setItem('refresh_token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  clearAll() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
