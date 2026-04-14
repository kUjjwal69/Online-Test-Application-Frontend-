import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card-inner">
          <div class="back-link"><a routerLink="/auth/login">← Back to login</a></div>
          <div class="icon-wrap">🔑</div>
          <h1 class="auth-title">Forgot password?</h1>
          <p class="auth-subtitle">No worries — enter your email and we'll send you a reset link.</p>

          <div class="success-box" *ngIf="success">
            <span class="success-icon">✅</span>
            <div>
              <strong>Check your inbox!</strong>
              <p>We've sent a password reset link to <strong>{{ email }}</strong>. It expires in 30 minutes.</p>
            </div>
          </div>

          <form #fpForm="ngForm" (ngSubmit)="onSubmit()" class="auth-form" *ngIf="!success">
            <div class="form-group" [class.error]="emailRef.invalid && emailRef.touched">
              <label>Email Address</label>
              <div class="input-wrap">
                <span class="input-icon">✉</span>
                <input type="email" name="email" [(ngModel)]="email" #emailRef="ngModel"
                  required email placeholder="you@example.com" />
              </div>
              <span class="field-error" *ngIf="emailRef.invalid && emailRef.touched">Enter a valid email</span>
            </div>

            <div class="error-alert" *ngIf="errorMessage">
              <span>⚠</span> {{ errorMessage }}
            </div>

            <button type="submit" class="submit-btn" [disabled]="loading || fpForm.invalid">
              <span *ngIf="!loading">Send Reset Link</span>
              <span *ngIf="loading" class="spinner-wrap">
                <mat-spinner diameter="18" strokeWidth="2"></mat-spinner> Sending...
              </span>
            </button>
          </form>

          <p class="auth-footer" *ngIf="success">
            Didn't receive it? <a href="#" (click)="success=false; $event.preventDefault()">Try again</a>
          </p>
          <p class="auth-footer">Remember your password? <a routerLink="/auth/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg); padding: 40px; }
    .auth-card { width: 100%; max-width: 440px; }
    .auth-card-inner { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 48px 40px; }
    .back-link { margin-bottom: 32px; }
    .back-link a { color: var(--color-text-muted); font-size: 14px; }
    .back-link a:hover { color: var(--color-primary); }
    .icon-wrap { font-size: 48px; margin-bottom: 20px; }
    .auth-title { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
    .auth-subtitle { color: var(--color-text-muted); margin-bottom: 32px; font-size: 14px; line-height: 1.6; }
    .success-box { display: flex; gap: 16px; align-items: flex-start; padding: 20px; background: rgba(61,214,140,0.1); border: 1px solid rgba(61,214,140,0.3); border-radius: var(--radius-sm); margin-bottom: 24px; }
    .success-icon { font-size: 24px; }
    .success-box strong { display: block; margin-bottom: 4px; color: var(--color-success); }
    .success-box p { font-size: 14px; color: var(--color-text-muted); }
    .auth-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 13px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; font-size: 15px; pointer-events: none; }
    .input-wrap input { width: 100%; padding: 13px 14px 13px 42px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); font-size: 15px; font-family: var(--font-main); outline: none; transition: border-color var(--transition); }
    .input-wrap input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(79,142,247,0.12); }
    .input-wrap input::placeholder { color: var(--color-text-dim); }
    .form-group.error .input-wrap input { border-color: var(--color-danger); }
    .field-error { font-size: 12px; color: var(--color-danger); }
    .error-alert { padding: 12px 16px; border-radius: var(--radius-sm); background: rgba(247,95,79,0.1); border: 1px solid rgba(247,95,79,0.3); color: var(--color-danger); font-size: 14px; display: flex; gap: 8px; }
    .submit-btn { padding: 14px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; cursor: pointer; font-family: var(--font-main); transition: all var(--transition); display: flex; align-items: center; justify-content: center; gap: 8px; }
    .submit-btn:hover:not(:disabled) { background: #6aa0ff; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-wrap { display: flex; align-items: center; gap: 8px; }
    .auth-footer { text-align: center; margin-top: 24px; color: var(--color-text-muted); font-size: 14px; }
    .auth-footer a { color: var(--color-primary); font-weight: 600; }
  `]
})
export class ForgotPasswordComponent {
  email = ''; loading = false; errorMessage = ''; success = false;
  constructor(private auth: AuthService) {}
  onSubmit(): void {
    this.loading = true; this.errorMessage = '';
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading = false; this.success = true; },
      error: (err) => { this.loading = false; this.errorMessage = err.error?.message || 'Failed to send reset link.'; }
    });
  }
}
