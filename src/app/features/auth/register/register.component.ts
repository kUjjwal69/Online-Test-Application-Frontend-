import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-logo">
          <span class="logo-icon">⬡</span>
          <span class="logo-text">ExamPro</span>
        </div>
        <div class="brand-tagline">Secure · Proctored · Reliable</div>
        <div class="brand-desc">
          <p>Join thousands of candidates taking secure, proctored examinations online. Your integrity is our priority.</p>
        </div>
        <div class="brand-stats">
          <div class="bs-item"><span class="bs-num">50K+</span><span class="bs-label">Exams Conducted</span></div>
          <div class="bs-item"><span class="bs-num">99.8%</span><span class="bs-label">Uptime</span></div>
          <div class="bs-item"><span class="bs-num">200+</span><span class="bs-label">Organizations</span></div>
        </div>
      </div>

      <div class="auth-card">
        <div class="auth-card-inner">
          <h1 class="auth-title">Create account</h1>
          <p class="auth-subtitle">Register as a candidate to take exams</p>

          <form #regForm="ngForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group" [class.error]="nameRef.invalid && nameRef.touched">
              <label>Full Name</label>
              <div class="input-wrap">
                <span class="input-icon">👤</span>
                <input type="text" name="fullName" [(ngModel)]="fullName" #nameRef="ngModel"
                  required minlength="3" placeholder="John Doe" />
              </div>
              <span class="field-error" *ngIf="nameRef.invalid && nameRef.touched">Min. 3 characters required</span>
            </div>

            <div class="form-group" [class.error]="userRef.invalid && userRef.touched">
              <label>Username</label>
              <div class="input-wrap">
                <span class="input-icon">👤</span>
                <input type="text" name="username" [(ngModel)]="username" #userRef="ngModel"
                  required minlength="3" maxlength="32" placeholder="Choose a username" autocomplete="username" />
              </div>
              <span class="field-error" *ngIf="userRef.invalid && userRef.touched">Username must be 3–32 characters</span>
            </div>

            <div class="form-group" [class.error]="passRef.invalid && passRef.touched">
              <label>Password</label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input [type]="showPass ? 'text' : 'password'" name="password" [(ngModel)]="password"
                  #passRef="ngModel" required minlength="8" placeholder="Min. 8 characters" />
                <button type="button" class="toggle-pass" (click)="showPass = !showPass">
                  {{ showPass ? '🙈' : '👁️' }}
                </button>
              </div>
              <span class="field-error" *ngIf="passRef.invalid && passRef.touched">Min. 8 characters required</span>
            </div>

            <div class="form-group" [class.error]="conf.invalid && conf.touched">
              <label>Confirm Password</label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input [type]="showPass ? 'text' : 'password'" name="confirmPassword" [(ngModel)]="confirmPassword"
                  #conf="ngModel" required placeholder="Repeat password" />
              </div>
              <span class="field-error" *ngIf="passwordMismatch">Passwords do not match</span>
            </div>

            <div class="error-alert" *ngIf="errorMessage">
              <span>⚠</span> {{ errorMessage }}
            </div>

            <button type="submit" class="submit-btn" [disabled]="loading || regForm.invalid">
              <span *ngIf="!loading">Create Account</span>
              <span *ngIf="loading" class="spinner-wrap">
                <mat-spinner diameter="18" strokeWidth="2"></mat-spinner>
                Creating account...
              </span>
            </button>
          </form>

          <p class="auth-footer">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; background: var(--color-bg); }
    .auth-brand {
      background: linear-gradient(145deg, #0e1428 0%, #111c3a 60%, #0a1020 100%);
      display: flex; flex-direction: column; justify-content: center; padding: 60px;
      position: relative; overflow: hidden;
    }
    .auth-brand::before {
      content: ''; position: absolute;
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(79,142,247,0.1) 0%, transparent 70%);
      bottom: -100px; right: -100px;
    }
    .brand-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
    .logo-icon { font-size: 36px; filter: drop-shadow(0 0 12px rgba(79,142,247,0.6)); }
    .logo-text {
      font-size: 32px; font-weight: 700; font-family: var(--font-mono);
      background: linear-gradient(135deg, #4f8ef7, #a0c4ff);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .brand-tagline { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 40px; }
    .brand-desc { color: var(--color-text-muted); line-height: 1.7; margin-bottom: 48px; font-size: 15px; }
    .brand-stats { display: flex; gap: 32px; }
    .bs-item { display: flex; flex-direction: column; gap: 4px; }
    .bs-num { font-size: 24px; font-weight: 700; font-family: var(--font-mono); color: var(--color-primary); }
    .bs-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .auth-card { display: flex; align-items: center; justify-content: center; padding: 40px; overflow-y: auto; }
    .auth-card-inner { width: 100%; max-width: 420px; }
    .auth-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .auth-subtitle { color: var(--color-text-muted); margin-bottom: 32px; font-size: 14px; }
    .auth-form { display: flex; flex-direction: column; gap: 18px; }

    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 13px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; font-size: 15px; pointer-events: none; }
    .input-wrap input {
      width: 100%; padding: 13px 14px 13px 42px;
      background: var(--color-surface-2); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text); font-size: 15px;
      font-family: var(--font-main); outline: none; transition: border-color var(--transition);
    }
    .input-wrap input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(79,142,247,0.12); }
    .input-wrap input::placeholder { color: var(--color-text-dim); }
    .form-group.error .input-wrap input { border-color: var(--color-danger); }
    .toggle-pass { position: absolute; right: 12px; background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; }
    .field-error { font-size: 12px; color: var(--color-danger); }
    .error-alert { padding: 12px 16px; border-radius: var(--radius-sm); background: rgba(247,95,79,0.1); border: 1px solid rgba(247,95,79,0.3); color: var(--color-danger); font-size: 14px; display: flex; gap: 8px; align-items: center; }
    .submit-btn { padding: 14px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; cursor: pointer; font-family: var(--font-main); transition: all var(--transition); display: flex; align-items: center; justify-content: center; gap: 8px; }
    .submit-btn:hover:not(:disabled) { background: #6aa0ff; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(79,142,247,0.4); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-wrap { display: flex; align-items: center; gap: 8px; }
    .auth-footer { text-align: center; margin-top: 24px; color: var(--color-text-muted); font-size: 14px; }
    .auth-footer a { color: var(--color-primary); font-weight: 600; }
    @media (max-width: 768px) { .auth-page { grid-template-columns: 1fr; } .auth-brand { display: none; } }
  `]
})
export class RegisterComponent {
  fullName = ''; username = ''; password = ''; confirmPassword = '';
  showPass = false; loading = false; errorMessage = '';

  get passwordMismatch(): boolean {
    return this.password !== this.confirmPassword && !!this.confirmPassword;
  }

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (this.passwordMismatch) return;
    this.loading = true; this.errorMessage = '';
    this.auth.register({ Email: this.fullName, username: this.username.trim(), password: this.password, confirmPassword: this.confirmPassword }).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/candidate/dashboard']); },
      error: (err) => { this.loading = false; this.errorMessage = err.error?.message || 'Registration failed. Please try again.'; }
    });
  }
}
