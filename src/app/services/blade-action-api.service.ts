import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export type Plant = 'UTL1' | 'UTL2' | 'UTL3';
export type ApiResp<T = any> = { success: boolean; message: string; errors: string[]; data: T };

// เหตุผลจาก API (จริงมีเฉพาะ toolEV_ID + tooling_EventName)
export type Reason = { toolEV_ID: number; tooling_EventName: string };

// preview payload ที่จะส่งกลับให้ UI
export type Preview<TPayload> = { preview: TPayload };

export type ReturnPayload = { saw_ToolingID: string };
export type RejectPayload = { saw_ToolingID: string; toolEV_ID: number };
export type ResetPayload  = { saw_ToolingID: string };

@Injectable({ providedIn: 'root' })
export class BladeActionApiService {
  private readonly ROOT = '/ToolingService/api/Tooling';

  /** โหมด: preview = ปลอดภัย (ไม่ยิง action จริง), dry-run = log, live = ยิงจริง */
  private readonly MODE: 'preview' | 'dry-run' | 'live' = 'preview';

  private readonly headers = new HttpHeaders({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  // ───────────────── Read: เหตุผล Reject จาก API จริง + cache ─────────────────
  private reasons$?: Observable<Reason[]>;

  /** เมธอดหลัก */
  getReasons(): Observable<Reason[]> {
    if (this.reasons$) return this.reasons$;

    const url = `${this.ROOT}/GetToolingEventName`;

    const normalize = (res: unknown): Reason[] => {
      const input = res as { data?: unknown } | unknown[];
      const arr: unknown[] = Array.isArray(input)
        ? input
        : Array.isArray((input as any)?.data)
          ? ((input as any).data as unknown[])
          : [];

      return arr
        .map((r: unknown) => {
          const o = r as Record<string, unknown>;
          const idRaw =
            o?.['toolEV_ID'] ??
            o?.['toolev_id'] ??
            o?.['id'];
          const nameRaw =
            o?.['tooling_EventName'] ??
            o?.['toolingeventname'] ??
            o?.['name'];

          const toolEV_ID = Number(idRaw);
          const tooling_EventName = String(nameRaw ?? '');

          return { toolEV_ID, tooling_EventName };
        })
        .filter((x: Reason) => Number.isFinite(x.toolEV_ID) && !!x.tooling_EventName);
    };

    // ส่วนมากรองรับ GET; ถ้าไม่รองรับให้ fallback เป็น POST {}
    this.reasons$ = this.http.get<unknown>(url, { headers: this.headers }).pipe(
      map(normalize),
      catchError(() => this.http.post<unknown>(url, {}, { headers: this.headers }).pipe(map(normalize))),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.reasons$;
  }

  /** ✅ Alias เพื่อให้ component เก่าที่เรียกชื่อเดิมใช้ได้ */
  getToolingEventNames(): Observable<Reason[]> {
    return this.getReasons();
  }

  // ───────────────── Actions ─────────────────
  returnBlade(saw_ToolingID: string): Observable<ApiResp<number> & Preview<ReturnPayload>> {
    const body: ReturnPayload = { saw_ToolingID: (saw_ToolingID || '').trim() };

    if (this.MODE === 'preview') {
      return of({ success: true, message: '[PREVIEW] ReturnBlade – ข้อมูลที่จะส่ง', errors: [], data: 0, preview: body });
    }
    if (this.MODE === 'dry-run') {
      // eslint-disable-next-line no-console
      console.log('[DRY RUN] ReturnBlade payload:', body);
      return of({ success: true, message: '[DRY RUN] Tooling return successfully', errors: [], data: 1, preview: body });
    }
    return this.http.post<ApiResp<number> & Preview<ReturnPayload>>(`${this.ROOT}/ReturnBlade`, body, { headers: this.headers });
  }

  rejectBlade(saw_ToolingID: string, toolEV_ID: number): Observable<ApiResp<number> & Preview<RejectPayload>> {
    const body: RejectPayload = {
      saw_ToolingID: (saw_ToolingID || '').trim(),
      toolEV_ID: Number(toolEV_ID),
    };

    if (this.MODE === 'preview') {
      return of({ success: true, message: '[PREVIEW] RejectBlade – ข้อมูลที่จะส่ง', errors: [], data: 0, preview: body });
    }
    if (this.MODE === 'dry-run') {
      // eslint-disable-next-line no-console
      console.log('[DRY RUN] RejectBlade payload:', body);
      return of({ success: true, message: '[DRY RUN] Tooling reject successfully', errors: [], data: 1, preview: body });
    }
    return this.http.post<ApiResp<number> & Preview<RejectPayload>>(`${this.ROOT}/RejectBlade`, body, { headers: this.headers });
  }

  resetBlade(saw_ToolingID: string): Observable<ApiResp<number> & Preview<ResetPayload>> {
    const body: ResetPayload = { saw_ToolingID: (saw_ToolingID || '').trim() };

    if (this.MODE === 'preview') {
      return of({ success: true, message: '[PREVIEW] ResetBlade – ข้อมูลที่จะส่ง', errors: [], data: 0, preview: body });
    }
    if (this.MODE === 'dry-run') {
      // eslint-disable-next-line no-console
      console.log('[DRY RUN] ResetBlade payload:', body);
      return of({ success: true, message: '[DRY RUN] Tooling reset successfully', errors: [], data: 1, preview: body });
    }
    return this.http.post<ApiResp<number> & Preview<ResetPayload>>(`${this.ROOT}/ResetBlade`, body, { headers: this.headers });
  }
}
