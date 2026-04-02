import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getAccessToken();

    // ✅ URL ที่ไม่ต้องแนบ token เช่น login/logout/refresh
    const isAuthPath = /\/Auth(Service)?\/api\/Auth\/(login|refresh|logout)/i.test(req.url);

    // ✅ แนบ token ถ้ามีและไม่ใช่ path login
    let authReq = req;
    if (token && !isAuthPath) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    // ✅ ถ้าเจอ 401 จะลอง refresh token แล้ว retry ใหม่อัตโนมัติ
    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !isAuthPath) {
          return this.auth.refreshAccessToken().pipe(
            switchMap((newToken) => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next.handle(retryReq);
            }),
            catchError(refreshErr => {
              this.auth.logout();
              return throwError(() => refreshErr);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}
