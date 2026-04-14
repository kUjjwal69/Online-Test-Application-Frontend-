import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../shared/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div *ngIf="loading" class="loading-overlay"><mat-spinner diameter="48"></mat-spinner></div>

    <div class="page-header">
      <h1>Overview</h1>
      <p>Monitor your examination platform at a glance</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid-4" style="margin-bottom:28px">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(79,142,247,0.15)">
          <mat-icon style="color:#4f8ef7">quiz</mat-icon>
        </div>
        <div class="stat-value">{{ stats.totalTests }}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(61,214,140,0.15)">
          <mat-icon style="color:#3dd68c">group</mat-icon>
        </div>
        <div class="stat-value">{{ stats.totalUsers }}</div>
        <div class="stat-label">Candidates</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(247,193,79,0.15)">
          <mat-icon style="color:#f7c14f">assignment</mat-icon>
        </div>
        <div class="stat-value">{{ stats.activeSessions }}</div>
        <div class="stat-label">Started Sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(247,95,79,0.15)">
          <mat-icon style="color:#f75f4f">gpp_bad</mat-icon>
        </div>
        <div class="stat-value">{{ stats.totalViolations }}</div>
        <div class="stat-label">Violations Today</div>
      </div>
    </div>

    <div class="grid-2">
      <!-- Recent Sessions -->
      <div class="panel">
        <div class="panel-header">
          <h3>Recent Sessions</h3>
          <a routerLink="/admin/sessions" class="panel-link">View all</a>
        </div>
        <div class="sessions-list">
          <div class="session-row" *ngFor="let s of recentSessions">
            <div class="session-user">
              <div class="avatar">{{ s.userName.charAt(0) }}</div>
              <div>
                <div class="s-name">{{ s.userName }}</div>
                <div class="s-test">{{ s.testTitle }}</div>
              </div>
            </div>
            <div class="session-meta">
              <span class="status-chip" [ngClass]="s.status.toLowerCase()">{{ s.status }}</span>
              <span class="s-time">{{ s.startTime | date:'shortTime' }}</span>
            </div>
          </div>
          <div class="empty-state" *ngIf="recentSessions.length === 0">
            <mat-icon>assignment</mat-icon>
            <h3>No sessions yet</h3>
            <p class="empty-copy">Assigned tests will show here after a candidate starts the exam.</p>
          </div>
        </div>
      </div>

      <!-- Active Tests -->
      <div class="panel">
        <div class="panel-header">
          <h3>Tests Overview</h3>
          <a routerLink="/admin/tests" class="panel-link">Manage</a>
        </div>
        <div class="tests-list">
          <div class="test-row" *ngFor="let t of tests.slice(0, 5)">
            <div class="t-info">
              <div class="t-title">{{ t.title }}</div>
              <div class="t-meta">{{ t.durationMinutes }}min · {{ t.totalMarks }} marks</div>
            </div>
            <div class="t-right">
              <span class="status-chip" [ngClass]="t.isActive ? 'active' : 'pending'">
                {{ t.isActive ? 'Active' : 'Inactive' }}
              </span>
              <span class="t-q">{{ t.questionCount || 0 }}Q</span>
            </div>
          </div>
          <div class="empty-state" *ngIf="tests.length === 0">
            <mat-icon>quiz</mat-icon>
            <h3>No tests yet</h3>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 24px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .panel-header h3 { font-size: 16px; font-weight: 700; }
    .panel-link { font-size: 13px; color: var(--color-primary); }
    .session-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
    .session-row:last-child { border-bottom: none; }
    .session-user { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-dim); color: var(--color-primary); font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; }
    .s-name { font-size: 14px; font-weight: 600; }
    .s-test { font-size: 12px; color: var(--color-text-muted); }
    .session-meta { display: flex; align-items: center; gap: 10px; }
    .s-time { font-size: 12px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .test-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
    .test-row:last-child { border-bottom: none; }
    .t-title { font-size: 14px; font-weight: 600; }
    .t-meta { font-size: 12px; color: var(--color-text-muted); }
    .t-right { display: flex; align-items: center; gap: 10px; }
    .t-q { font-size: 12px; font-family: var(--font-mono); color: var(--color-text-muted); background: var(--color-surface-2); padding: 2px 8px; border-radius: 4px; }
    .empty-copy { margin-top: 8px; color: var(--color-text-muted); font-size: 13px; text-align: center; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  stats = { totalTests: 0, totalUsers: 0, activeSessions: 0, totalViolations: 0 };
  recentSessions: any[] = [];
  tests: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    forkJoin({
      tests: this.adminService.getAllTests(),
      users: this.adminService.getAllUsers(),
      sessions: this.adminService.getAllSessions(),
      violations: this.adminService.getAllViolations()
    }).subscribe({
      next: ({ tests, users, sessions, violations }) => {
        const candidates = users.filter(user => this.isCandidate(user));
        this.tests = tests;
        this.stats.totalTests = tests.length;
        this.stats.totalUsers = candidates.length > 0 ? candidates.length : users.length;
        this.stats.activeSessions = sessions.filter(s => s.status === 'Active').length;
        this.stats.totalViolations = violations.length;
        this.recentSessions = sessions.slice(0, 6);
        console.log('[AdminDashboardComponent.data]', {
          tests: tests.length,
          users: users.length,
          candidateCount: candidates.length,
          userRoles: users.map(user => user.role)
        });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private isCandidate(user: User): boolean {
    const role = (user.role || '').trim().toLowerCase();
    return role === 'user'
      || role === 'candidate'
      || role === 'student'
      || role === 'role_user'
      || role === 'examuser';
  }
}
