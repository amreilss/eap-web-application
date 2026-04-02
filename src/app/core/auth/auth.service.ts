import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, throwError, of } from 'rxjs';
import { catchError, first, switchMap, tap, delay } from 'rxjs/operators';
import { ApiResp, LoginData, LoginReq, decodeJwt } from './auth.models';
import { TokenStorage } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = '/AuthService/api/Auth';
  private refreshing = false;
  private refreshSubject = new Subject<string>();

  private loggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedInSubject.asObservable();

  private userSubject = new BehaviorSubject<{ id?: string; name?: string } | null>(null);
  user$ = this.userSubject.asObservable();

  private loginPopupSubject = new Subject<void>();
  loginPopup$ = this.loginPopupSubject.asObservable();
  triggerLoginPopup() {
    this.loginPopupSubject.next();
  }

  constructor(private http: HttpClient, private store: TokenStorage) {
    const accessToken = this.store.getAccessToken();

    if (accessToken) {
      this.loggedInSubject.next(true);
      this.updateUserFromAccessToken(accessToken);
    } else {
      this.loggedInSubject.next(false);
    }
  }

  private updateUserFromAccessToken(at?: string, fallback?: { id?: string; name?: string }) {
    if (!at && !fallback) { this.userSubject.next(null); return; }

    if (fallback?.id || fallback?.name) {
      this.userSubject.next({ id: fallback.id, name: fallback.name });
      return;
    }

    if (at) {
      const payload = decodeJwt<any>(at) || {};
      const id = payload.userId || payload.sub || payload.uid || payload.nameid;
      const name = payload.name || payload.given_name || payload.unique_name;
      this.userSubject.next(id || name ? { id, name } : null);
    }
  }

  // ✅ MOCK LOGIN
  login(dto: LoginReq) {
    const mockResponse: ApiResp<LoginData> = {
      data: {
        accessToken: 'mock-access-token-123',
        refreshToken: 'mock-refresh-token-456',
        user: {
          id: '1',
          name: dto.userID || 'Demo User'
        }
      }
    } as any;

    return of(mockResponse).pipe(
      delay(500), // ทำให้เหมือนยิง API จริง
      tap(res => {
        const at = res.data?.accessToken;
        const rt = res.data?.refreshToken;

        if (at) this.store.setAccessToken(at);
        if (rt) this.store.setRefreshToken(rt);

        this.loggedInSubject.next(!!at);
        this.updateUserFromAccessToken(at, {
          id: res.data?.user?.id,
          name: res.data?.user?.name
        });
      })
    );
  }

  getAccessToken() {
    return this.store.getAccessToken();
  }

  // ❗ MOCK REFRESH (กัน error เฉย ๆ)
  refreshAccessToken(): Observable<string> {
    const newToken = 'mock-access-token-123';

    return of(newToken).pipe(
      delay(300),
      tap(token => {
        this.store.setAccessToken(token);
        this.loggedInSubject.next(true);
      })
    );
  }

  changePassword(dto: {
    oldUserPassword: string;
    newUserPassword: string;
    confirmUserPassword: string;
  }) {
    return of({ message: 'Password changed (mock)' }).pipe(delay(300));
  }

  // ❗ MOCK LOGOUT
  logout() {
    this.store.clearAll();
    this.loggedInSubject.next(false);
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return this.store.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.store.getRefreshToken();
  }
}