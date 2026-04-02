import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MachineStatus } from '../../services/websocket.service'; // ปรับ path ให้ตรงโปรเจกต์

export const machineResolver: ResolveFn<MachineStatus | null> = (route) => {
  const http = inject(HttpClient);
  const id = route.paramMap.get('equipID') || route.paramMap.get('id') || '';
  if (!id) return of(null);
  return http.get<MachineStatus>(`/api/Status/${id}`).pipe(
    catchError(() => of(null))
  );
};
