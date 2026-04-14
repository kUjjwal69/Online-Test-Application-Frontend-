import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-logo">
          <span class="logo-icon">⬡</span>
          <span class="logo-text">ExamPro</span>
        </div>
        <div class="brand-tagline">Secure · Proctored · Reliable</div>
        <div class="brand-features">
          <div class="feature-item"><span class="fi-icon">🎥</span> Real-time video proctoring</div>
          <div class="feature-item"><span class="fi-icon">🛡️</span> AI violation detection</div>
          <div class="feature-item"><span class="fi-icon">📊</span> Instant result analytics</div>
          <div class="feature-item"><span class="fi-icon">⏱️</span> Smart auto-submit timer</div>
        </div>
      </div>

      <div class="auth-card">
        <div class="auth-card-inner">
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-subtitle">Sign in to your account to continue</p>

          <form #loginForm="ngForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group" [class.error]="userRef.invalid && userRef.touched">
              <label>Username</label>
              <div class="input-wrap">
                <span class="input-icon">👤</span>
                <input
                  type="text"
                  name="username"
                  [(ngModel)]="username"
                  #userRef="ngModel"
                  required
                  minlength="3"
                  placeholder="Your username"
                  autocomplete="username"
                />
              </div>
              <span class="field-error" *ngIf="userRef.invalid && userRef.touched">Enter a username (min. 3 characters)</span>
            </div>

            <div class="form-group" [class.error]="passRef.invalid && passRef.touched">
              <label>
                Password
                <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
              </label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  #passRef="ngModel"
                  required
                  minlength="6"
                  placeholder="Your password"
                  autocomplete="current-password"
                />
                <button type="button" class="toggle-pass" (click)="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <span class="field-error" *ngIf="passRef.invalid && passRef.touched">Min. 6 characters</span>
            </div>

            <div class="error-alert" *ngIf="errorMessage">
              <span>⚠</span> {{ errorMessage }}
            </div>

            <button type="submit" class="submit-btn" [disabled]="loading || loginForm.invalid">
              <span *ngIf="!loading">Sign In</span>
              <span *ngIf="loading" class="spinner-wrap">
                <mat-spinner diameter="18" strokeWidth="2"></mat-spinner>
                Signing in...
              </span>
            </button>
          </form>

          <p class="auth-footer">
            Don't have an account? <a routerLink="/auth/register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--color-bg);
    }

    /* Brand Panel */
    .auth-brand {
      background: linear-gradient(145deg, #0e1428 0%, #111c3a 60%, #0a1020 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px;
      position: relative;
      overflow: hidden;
    }
    .auth-brand::before {
      content: '';
      position: absolute;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%);
      top: -100px; left: -100px;
    }
    .brand-logo {
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 20px;
    }
    .logo-icon {
      font-size: 36px;
      filter: drop-shadow(0 0 12px rgba(79,142,247,0.6));
    }
    .logo-text {
      font-size: 32px; font-weight: 700;
      font-family: var(--font-mono);
      background: linear-gradient(135deg, #4f8ef7, #a0c4ff);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .brand-tagline {
      font-size: 13px; letter-spacing: 3px;
      text-transform: uppercase; color: var(--color-text-muted);
      margin-bottom: 60px;
    }
    .brand-features { display: flex; flex-direction: column; gap: 20px; }
    .feature-item {
      display: flex; align-items: center; gap: 12px;
      color: var(--color-text-muted); font-size: 15px;
    }
    .fi-icon { font-size: 20px; }

    /* Card */
    .auth-card {
      display: flex; align-items: center; justify-content: center;
      padding: 40px;
    }
    .auth-card-inner { width: 100%; max-width: 420px; }

    .auth-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .auth-subtitle { color: var(--color-text-muted); margin-bottom: 36px; font-size: 14px; }

    .auth-form { display: flex; flex-direction: column; gap: 20px; }

    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label {
      font-size: 13px; font-weight: 600; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .forgot-link { font-size: 12px; color: var(--color-primary); text-transform: none; letter-spacing: 0; }
    .forgot-link:hover { text-decoration: underline; }

    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; font-size: 15px; pointer-events: none; }
    .input-wrap input {
      width: 100%; padding: 13px 14px 13px 42px;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text); font-size: 15px;
      font-family: var(--font-main);
      outline: none; transition: border-color var(--transition);
    }
    .input-wrap input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(79,142,247,0.12); }
    .input-wrap input::placeholder { color: var(--color-text-dim); }
    .form-group.error .input-wrap input { border-color: var(--color-danger); }

    .toggle-pass {
      position: absolute; right: 12px;
      background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;
    }

    .field-error { font-size: 12px; color: var(--color-danger); }

    .error-alert {
      padding: 12px 16px; border-radius: var(--radius-sm);
      background: rgba(247,95,79,0.1); border: 1px solid rgba(247,95,79,0.3);
      color: var(--color-danger); font-size: 14px;
      display: flex; gap: 8px; align-items: center;
    }

    .submit-btn {
      padding: 14px; background: var(--color-primary);
      color: #fff; border: none; border-radius: var(--radius-sm);
      font-size: 15px; font-weight: 600; cursor: pointer;
      font-family: var(--font-main);
      transition: all var(--transition);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .submit-btn:hover:not(:disabled) { background: #6aa0ff; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(79,142,247,0.4); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-wrap { display: flex; align-items: center; gap: 8px; }

    .auth-footer { text-align: center; margin-top: 24px; color: var(--color-text-muted); font-size: 14px; }
    .auth-footer a { color: var(--color-primary); font-weight: 600; }

    @media (max-width: 768px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router, private snackBar: MatSnackBar) {}

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        const targetUrl = this.auth.isAdmin() ? '/admin/dashboard' : '/candidate/dashboard';
        console.log('[LoginComponent.loginSuccess]', {
          apiRole: res.role,
          normalizedRole: this.auth.getRole(),
          isAuthenticated: this.auth.isAuthenticated(),
          targetUrl
        });
        this.router.navigate([targetUrl]).then(navigated => {
          console.log('[LoginComponent.navigate]', { targetUrl, navigated });
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid credentials. Please try again.';
      }
    });
  }
}
