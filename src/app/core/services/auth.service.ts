import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, DecodedToken, LoginRequest, RegisterRequest } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'exam_token';
  private readonly USER_KEY = 'exam_user';
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/login`, request).pipe(
      map(r => this.unwrapAuthPayload(r)),
      map(r => this.normalizeAuthResponse(r)),
      tap(response => this.storeAuth(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/register`, request).pipe(
      map(r => this.unwrapAuthPayload(r)),
      map(r => this.normalizeAuthResponse(r)),
      tap(response => this.storeAuth(response))
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, { token, newPassword });
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
        email: this.extractStringClaim(decoded, ['email'])?? undefined,
        name: this.extractStringClaim(decoded, ['name', 'given_name']) ?? '',
        role,
        exp,
        iat: this.extractNumericClaim(decoded, ['iat']) ?? 0
      };
    } catch {
      return null;
    }
  }

  private normalizeAuthResponse(r: Partial<AuthResponse> & { email?: string; token?: string }): AuthResponse {
    const token = r.token ?? '';
    const decodedToken = token ? this.decodeToken(token) : null;
    const normalizedRole = this.normalizeRole(r.role ?? decodedToken?.role);

    return {
      token,
      userId: r.userId ?? '',
      fullName: r.fullName ?? decodedToken?.name ?? '',
      username: r.username ?? r.email ?? decodedToken?.username ?? decodedToken?.email ?? '',
      role: normalizedRole,
      expiresAt: r.expiresAt ?? ''
    };
  }

  private storeAuth(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this.currentUserSubject.next(response);
  }

  private getUserFromStorage(): AuthResponse | null {
    const user = localStorage.getItem(this.USER_KEY);
    if (!user) return null;
    try {
      const parsed = JSON.parse(user) as AuthResponse & { email?: string };
      return this.normalizeAuthResponse(parsed);
    } catch {
      return null;
    }
  }

  private normalizeRole(role: string | null | undefined): string {
    const normalizedRole = (role || '').trim().toLowerCase();

    if (['role_admin', 'administrator', 'admin'].includes(normalizedRole)) return 'admin';
    if ([
      'role_user',
      'role_candidate',
      'student',
      'candidate',
      'user',
      'examuser',
      'exam_user'
    ].includes(normalizedRole)) return 'user';

    return normalizedRole;
  }

  private unwrapAuthPayload(response: any): Partial<AuthResponse> & { email?: string; token?: string } {
    if (!response || typeof response !== 'object') return {};
    const payload = response.data ?? response.Data ?? response;
    if (!payload || typeof payload !== 'object') return {};
    const src = payload as Record<string, any>;
    return {
      token: this.readStr(src, ['token', 'Token']) ?? '',
      userId: this.readStr(src, ['userId', 'UserId', 'id', 'Id']) ?? '',
      fullName: this.readStr(src, ['fullName', 'FullName', 'name', 'Name']) ?? '',
      username: this.readStr(src, ['username', 'Username']) ?? '',
      email: this.readStr(src, ['email', 'Email']) ?? '',
      role: this.readStr(src, ['role', 'Role']) ?? '',
      expiresAt: this.readStr(src, ['expiresAt', 'ExpiresAt']) ?? ''
    };
  }

  private readStr(source: Record<string, any>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return null;
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
}
