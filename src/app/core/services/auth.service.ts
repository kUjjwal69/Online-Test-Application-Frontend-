import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiResponse, AuthResponse, DecodedToken, LoginRequest, RegisterRequest } from '../../shared/models/models';
import { API_ENDPOINTS } from '../config/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'exam_token';
  private readonly USER_KEY = 'exam_user';
  private readonly authApiUrl = API_ENDPOINTS.auth;

  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<unknown> | unknown>(`${this.authApiUrl}/login`, request).pipe(
      map(r => this.normalizeAuthResponse(r)),
      tap(response => this.storeAuth(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<unknown> | unknown>(`${this.authApiUrl}/register`, request).pipe(
      map(r => this.normalizeAuthResponse(r)),
      tap(response => this.storeAuth(response))
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/reset-password`, { token, newPassword });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const tokenExpiry = this.getTokenExpiry(token);
    if (tokenExpiry !== null) return tokenExpiry > Date.now();

    const storedExpiry = this.getStoredExpiry();
    if (storedExpiry !== null) return storedExpiry > Date.now();

    return false;
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  getRole(): string {
    return this.normalizeRole(this.getCurrentUser()?.role);
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  isCandidate(): boolean {
    const role = this.getRole();
    return role === 'user' || role === 'candidate';
  }

  decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const decoded = JSON.parse(this.decodeBase64Url(payload)) as Record<string, unknown>;
      const role = this.extractRole(decoded);
      const exp = this.extractExp(decoded);

      if (exp === null) return null;

      return {
        sub: this.extractStringClaim(decoded, ['sub', 'nameid']) ?? '',
        username: this.extractStringClaim(decoded, ['username', 'unique_name', 'email']) ?? undefined,
        email: this.extractStringClaim(decoded, ['email']) ?? undefined,
        name: this.extractStringClaim(decoded, ['name', 'given_name']) ?? '',
        role,
        exp,
        iat: this.extractNumericClaim(decoded, ['iat']) ?? 0
      };
    } catch {
      return null;
    }
  }

  private normalizeAuthResponse(rawResponse: ApiResponse<unknown> | unknown): AuthResponse {
    const payload = this.unwrapAuthPayload(rawResponse);
    const token = this.extractToken(payload);
    const decodedToken = token ? this.decodeToken(token) : null;
    const normalizedRole = this.normalizeRole(this.readString(payload, ['role']) ?? decodedToken?.role);

    return {
      token,
      userId: this.readString(payload, ['userId', 'id']) ?? '',
      fullName: this.readString(payload, ['fullName', 'name']) ?? decodedToken?.name ?? '',
      username: this.readString(payload, ['username', 'email']) ?? decodedToken?.username ?? decodedToken?.email ?? '',
      role: normalizedRole,
      expiresAt: this.readString(payload, ['expiresAt', 'expiration', 'expires']) ?? ''
    };
  }

  private storeAuth(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this.currentUserSubject.next(response);
    console.log('[AuthService.storeAuth]', {
      role: response.role,
      expiresAt: response.expiresAt,
      hasToken: !!response.token,
      tokenPreview: response.token?.slice(0, 20)
    });
  }

  private getUserFromStorage(): AuthResponse | null {
    const user = localStorage.getItem(this.USER_KEY);
    if (!user) return null;
    const parsed = JSON.parse(user) as AuthResponse & { email?: string };
    return this.normalizeAuthResponse(parsed);
  }

  private unwrapAuthPayload(rawResponse: ApiResponse<unknown> | unknown): Record<string, unknown> {
    if (!rawResponse || typeof rawResponse !== 'object') return {};

    const responseRecord = rawResponse as Record<string, unknown>;
    const data = responseRecord['data'];

    if (data && typeof data === 'object') return data as Record<string, unknown>;

    return responseRecord;
  }

  private extractToken(payload: Record<string, unknown>): string {
    return this.readString(payload, ['token', 'accessToken', 'jwt', 'jwtToken']) ?? '';
  }

  private normalizeRole(role: string | null | undefined): string {
    const normalizedRole = (role || '').trim().toLowerCase();

    if (normalizedRole === 'role_admin' || normalizedRole === 'administrator') return 'admin';
    if (normalizedRole === 'role_user' || normalizedRole === 'student') return 'user';

    return normalizedRole;
  }

  private getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded ? decoded.exp * 1000 : null;
  }

  private getStoredExpiry(): number | null {
    const expiresAt = this.getCurrentUser()?.expiresAt;
    if (!expiresAt) return null;

    const parsedDate = Date.parse(expiresAt);
    return Number.isNaN(parsedDate) ? null : parsedDate;
  }

  private decodeBase64Url(payload: string): string {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const binary = atob(paddedPayload);

    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  private extractRole(decoded: Record<string, unknown>): string {
    return this.normalizeRole(this.extractStringClaim(decoded, [
      'role',
      'roles',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ]));
  }

  private extractExp(decoded: Record<string, unknown>): number | null {
    return this.extractNumericClaim(decoded, ['exp']);
  }

  private extractStringClaim(decoded: Record<string, unknown>, claimNames: string[]): string | null {
    for (const claimName of claimNames) {
      const value = decoded[claimName];
      if (typeof value === 'string' && value.trim()) return value;
      if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) return value[0];
    }

    return null;
  }

  private extractNumericClaim(decoded: Record<string, unknown>, claimNames: string[]): number | null {
    for (const claimName of claimNames) {
      const value = decoded[claimName];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsedValue = Number(value);
        if (Number.isFinite(parsedValue)) return parsedValue;
      }
    }

    return null;
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value;
    }

    return null;
  }
}
