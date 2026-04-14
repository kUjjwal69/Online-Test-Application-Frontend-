import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CandidateService } from '../../../core/services/candidate.service';
import { AuthService } from '../../../core/services/auth.service';
import { TestAssignment } from '../../../shared/models/models';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header">
      <h1>Welcome back, {{ userName }}!</h1>
      <p>{{ today | date:'EEEE, MMMM d, y' }}</p>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px"><mat-spinner diameter="48"></mat-spinner></div>

    <ng-container *ngIf="!loading">
      <div class="grid-4" style="margin-bottom:28px">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(79,142,247,0.15)"><mat-icon style="color:#4f8ef7">assignment</mat-icon></div>
          <div class="stat-value">{{ stats.assigned }}</div>
          <div class="stat-label">Tests Assigned</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(247,193,79,0.15)"><mat-icon style="color:#f7c14f">pending</mat-icon></div>
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(61,214,140,0.15)"><mat-icon style="color:#3dd68c">check_circle</mat-icon></div>
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(247,95,79,0.15)"><mat-icon style="color:#f75f4f">block</mat-icon></div>
          <div class="stat-value">{{ stats.suspended }}</div>
          <div class="stat-label">Suspended</div>
        </div>
      </div>

      <!-- Pending Tests -->
      <div class="panel">
        <div class="panel-header">
          <h3>Upcoming Tests</h3>
          <a routerLink="/candidate/tests" class="panel-link">View all</a>
        </div>
        <div class="test-cards" *ngIf="pendingAssignments.length > 0">
          <div class="test-card" *ngFor="let a of pendingAssignments.slice(0, 4)">
            <div class="tc-header">
              <span class="status-chip not-started">{{ a.status }}</span>
              <span class="tc-expires" *ngIf="a.expiresAt">Expires {{ a.expiresAt | date:'shortDate' }}</span>
            </div>
            <h4 class="tc-title">{{ a.testTitle }}</h4>
            <a [routerLink]="['/candidate/tests']" class="start-btn">Start Test →</a>
          </div>
        </div>
        <div class="empty-state" *ngIf="pendingAssignments.length === 0">
          <mat-icon>assignment</mat-icon>
          <h3>No pending tests</h3>
          <p>You're all caught up!</p>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .page-header { margin-bottom: 28px; }
    .page-header h1 { font-size: 26px; font-weight: 700; }
    .page-header p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
    .panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 24px; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .panel-header h3 { font-size: 16px; font-weight: 700; }
    .panel-link { font-size: 13px; color: var(--color-primary); }
    .test-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .test-card { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 20px; transition: all var(--transition); }
    .test-card:hover { border-color: var(--color-primary); }
    .tc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .tc-expires { font-size: 11px; color: var(--color-warning); }
    .tc-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
    .start-btn { display: inline-block; padding: 8px 16px; background: var(--color-primary-dim); color: var(--color-primary); border-radius: var(--radius-sm); font-size: 13px; font-weight: 700; transition: all var(--transition); }
    .start-btn:hover { background: var(--color-primary); color: #fff; text-decoration: none; }
  `]
})
export class CandidateDashboardComponent implements OnInit {
  assignments: TestAssignment[] = []; loading = true;
  today = new Date();
  get userName(): string { return this.auth.getCurrentUser()?.fullName || 'Candidate'; }
  get pendingAssignments(): TestAssignment[] { return this.assignments.filter(a => a.status === 'NotStarted'); }
  get stats() {
    return {
      assigned: this.assignments.length,
      pending: this.assignments.filter(a => a.status === 'NotStarted').length,
      completed: this.assignments.filter(a => a.status === 'Completed').length,
      suspended: this.assignments.filter(a => a.status === 'Suspended').length
    };
  }
  constructor(private candidateService: CandidateService, private auth: AuthService) {}
  ngOnInit(): void { this.candidateService.getMyAssignments().subscribe({ next: a => { this.assignments = a; this.loading = false; }, error: () => this.loading = false }); }
}
