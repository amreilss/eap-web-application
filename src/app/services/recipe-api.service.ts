import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UploadRecipeResponse {
  recipeId: string;
  message?: string;
  fileName?: string;
  version?: string;
}

@Injectable({ providedIn: 'root' })
export class RecipeApiService {
  private base = '/EAPAPI';

  constructor(private http: HttpClient) {}

  uploadRecipe(
    equipID: string,
    file: File,
    meta: { recipeName: string; version?: string; note?: string }
  ): Observable<UploadRecipeResponse> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('recipeName', meta.recipeName);
    if (meta.version) fd.append('version', meta.version);
    if (meta.note) fd.append('note', meta.note);

    return this.http.post<UploadRecipeResponse>(
      `${this.base}/recipes/${encodeURIComponent(equipID)}/upload`,
      fd
    );
  }

  // (ออปชัน) แบบแสดง progress
  uploadRecipeWithProgress(
    equipID: string,
    file: File,
    meta: { recipeName: string; version?: string; note?: string }
  ): Observable<HttpEvent<any>> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('recipeName', meta.recipeName);
    if (meta.version) fd.append('version', meta.version);
    if (meta.note) fd.append('note', meta.note);

    const req = new HttpRequest(
      'POST',
      `${this.base}/recipes/${encodeURIComponent(equipID)}/upload`,
      fd,
      { reportProgress: true }
    );
    return this.http.request(req);
  }
}
