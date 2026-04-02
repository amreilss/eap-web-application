export interface ApiResp<T> { success: boolean; message: string; errors: any[]; data: T; }
export interface LoginReq { userID: string; userPassword: string; }
export interface LoginData {
  accessToken: string;
  refreshToken: string;
  user?: { id?: string; name?: string; roles?: string[] }; // ถ้า BE ส่งมา
}

export function decodeJwt<T = any>(token: string): T | null {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}
