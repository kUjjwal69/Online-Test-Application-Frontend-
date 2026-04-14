import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { TestSession, Violation, Screenshot } from '../../../shared/models/models';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="margin-bottom:24px"><a routerLink="/admin/sessions" class="back-link">← Back to Sessions</a></div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px"><mat-spinner diameter="48"></mat-spinner></div>

    <ng-container *ngIf="!loading && session">
      <div class="detail-header">
        <div>
          <h1>{{ session.testTitle }}</h1>
          <p>{{ session.userName }} · Started {{ session.startTime | date:'medium' }}</p>
        </div>
        <div class="header-right">
          <span class="status-chip" [ngClass]="session.status.toLowerCase()">{{ session.status }}</span>
          <button class="btn-danger" *ngIf="session.status === 'Active'" (click)="suspendSession()">
            <mat-icon>block</mat-icon> Suspend
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid-4" style="margin-bottom:28px">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(61,214,140,0.15)"><mat-icon style="color:#3dd68c">check_circle</mat-icon></div>
          <div class="stat-value">{{ session.score ?? '—' }}</div>
          <div class="stat-label">Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(79,142,247,0.15)"><mat-icon style="color:#4f8ef7">percent</mat-icon></div>
          <div class="stat-value">{{ session.percentage?.toFixed(0) ?? '—' }}%</div>
          <div class="stat-label">Percentage</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(247,95,79,0.15)"><mat-icon style="color:#f75f4f">gpp_bad</mat-icon></div>
          <div class="stat-value">{{ session.violationCount }}</div>
          <div class="stat-label">Violations</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(247,193,79,0.15)"><mat-icon style="color:#f7c14f">schedule</mat-icon></div>
          <div class="stat-value">{{ timeTaken }}</div>
          <div class="stat-label">Time Taken</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Violations -->
        <div class="panel">
          <h3 class="panel-title"><mat-icon>gpp_bad</mat-icon> Violations ({{ violations.length }})</h3>
          <div class="violations-list">
            <div class="violation-item" *ngFor="let v of violations">
              <span class="v-type">{{ v.violationType }}</span>
              <span class="v-desc">{{ v.description }}</span>
              <span class="v-time">{{ v.occurredAt | date:'shortTime' }}</span>
            </div>
            <div class="empty-state" *ngIf="violations.length === 0">
              <mat-icon>check_circle</mat-icon>
              <h3>No violations</h3>
            </div>
          </div>
        </div>

        <!-- Screenshots -->
        <div class="panel">
          <h3 class="panel-title"><mat-icon>screenshot_monitor</mat-icon> Screenshots ({{ screenshots.length }})</h3>
          <div class="screenshots-grid">
            <div class="screenshot-thumb" *ngFor="let ss of screenshots" (click)="viewScreenshot(ss)">
              <img *ngIf="ss.imageBase64" [src]="'data:image/jpeg;base64,' + ss.imageBase64" alt="screenshot" />
              <div *ngIf="!ss.imageBase64" class="no-img"><mat-icon>image</mat-icon></div>
              <div class="ss-time">{{ ss.capturedAt | date:'shortTime' }}</div>
            </div>
            <div class="empty-state" *ngIf="screenshots.length === 0">
              <mat-icon>screenshot_monitor</mat-icon>
              <h3>No screenshots</h3>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .back-link { font-size: 13px; color: var(--color-text-muted); }
    .back-link:hover { color: var(--color-primary); }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .detail-header h1 { font-size: 24px; font-weight: 700; }
    .detail-header p { color: var(--color-text-muted); margin-top: 4px; font-size: 14px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .btn-danger { display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: var(--color-danger); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); }
    .btn-danger mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 24px; }
    .panel-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .panel-title mat-icon { font-size: 20px !important; width: 20px; height: 20px; color: var(--color-text-muted); }
    .violations-list { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow-y: auto; }
    .violation-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--color-surface-2); border-radius: var(--radius-sm); border-left: 3px solid var(--color-danger); }
    .v-type { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-danger); min-width: 120px; }
    .v-desc { flex: 1; font-size: 13px; color: var(--color-text-muted); }
    .v-time { font-size: 11px; color: var(--color-text-dim); font-family: var(--font-mono); }
    .screenshots-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-height: 340px; overflow-y: auto; }
    .screenshot-thumb { border-radius: var(--radius-sm); overflow: hidden; cursor: pointer; border: 1px solid var(--color-border); transition: all var(--transition); }
    .screenshot-thumb:hover { border-color: var(--color-primary); transform: scale(1.02); }
    .screenshot-thumb img { width: 100%; height: 80px; object-fit: cover; display: block; }
    .no-img { width: 100%; height: 80px; display: flex; align-items: center; justify-content: center; background: var(--color-surface-2); color: var(--color-text-dim); }
    .ss-time { padding: 4px; font-size: 10px; color: var(--color-text-dim); text-align: center; font-family: var(--font-mono); }
  `]
})
export class SessionDetailComponent implements OnInit {
  session: TestSession | null = null; violations: Violation[] = []; screenshots: Screenshot[] = []; loading = true;
  get timeTaken(): string {
    if (!this.session?.startTime || !this.session?.endTime) return '—';
    const diff = new Date(this.session.endTime).getTime() - new Date(this.session.startTime).getTime();
    const mins = Math.floor(diff / 60000);
    return `${mins}m`;
  }
  constructor(private route: ActivatedRoute, private adminService: AdminService, private snackBar: MatSnackBar) {}
  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    forkJoin({ session: this.adminService.getSessionById(id), violations: this.adminService.getAllViolations(id), screenshots: this.adminService.getScreenshots(id) }).subscribe({
      next: (r) => { this.session = r.session; this.violations = r.violations; this.screenshots = r.screenshots; this.loading = false; },
      error: () => this.loading = false
    });
  }
  suspendSession(): void {
    const reason = prompt('Reason for suspension:');
    if (!reason || !this.session) return;
    this.adminService.suspendSession({ sessionId: this.session.id, reason }).subscribe({ next: () => { this.snackBar.open('Suspended', 'OK'); if (this.session) this.session.status = 'Suspended'; }, error: () => this.snackBar.open('Failed', 'Close') });
  }
  viewScreenshot(ss: Screenshot): void { if (ss.imageBase64) window.open('data:image/jpeg;base64,' + ss.imageBase64, '_blank'); }
}
