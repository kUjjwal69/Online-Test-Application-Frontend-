import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { TestSession } from '../../../shared/models/models';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header" style="margin-bottom:28px">
      <h1>Test Sessions</h1>
      <p>Monitor examination sessions after candidates start their assigned tests</p>
    </div>

    <div class="filter-bar">
      <div class="search-wrap">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Search candidate or test..." [(ngModel)]="searchQuery" />
      </div>
      <div class="status-filters">
        <button *ngFor="let s of statusFilters" class="filter-btn" [class.active]="selectedStatus === s" (click)="selectedStatus = s">{{ s }}</button>
      </div>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px"><mat-spinner diameter="48"></mat-spinner></div>

    <div class="sessions-table" *ngIf="!loading">
      <div class="t-head">
        <span>Candidate</span>
        <span>Test</span>
        <span>Started</span>
        <span>Status</span>
        <span>Score</span>
        <span>Violations</span>
        <span>Actions</span>
      </div>
      <div class="t-row" *ngFor="let s of filteredSessions">
        <div class="u-cell">
          <div class="avatar">{{ s.userName.charAt(0) }}</div>
          <span>{{ s.userName }}</span>
        </div>
        <span class="test-name">{{ s.testTitle }}</span>
        <span class="ts-time">{{ s.startTime | date:'short' }}</span>
        <span><span class="status-chip" [ngClass]="s.status.toLowerCase()">{{ s.status }}</span></span>
        <span class="score-cell">
          <span *ngIf="s.score !== null && s.score !== undefined">{{ s.score }}/{{ s.percentage?.toFixed(0) }}%</span>
          <span *ngIf="s.score === null || s.score === undefined" class="text-muted">—</span>
        </span>
        <span class="violations-cell" [class.danger]="s.violationCount > 0">{{ s.violationCount }}</span>
        <div class="actions-cell">
          <a [routerLink]="['/admin/sessions', s.id]" class="icon-btn" matTooltip="View Details">
            <mat-icon>visibility</mat-icon>
          </a>
          <button class="icon-btn danger" *ngIf="s.status === 'Active'" (click)="suspendSession(s)" matTooltip="Suspend Session">
            <mat-icon>block</mat-icon>
          </button>
        </div>
      </div>
      <div class="empty-state" *ngIf="filteredSessions.length === 0">
        <mat-icon>assignment</mat-icon>
        <h3>No sessions found</h3>
        <p class="empty-copy">Assigned tests appear here only after the candidate starts the exam.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header h1 { font-size: 26px; font-weight: 700; }
    .page-header p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
    .filter-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-wrap { display: flex; align-items: center; gap: 10px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 10px 14px; flex: 1; min-width: 200px; }
    .search-wrap mat-icon { color: var(--color-text-muted); }
    .search-wrap input { flex: 1; background: none; border: none; outline: none; color: var(--color-text); font-size: 14px; font-family: var(--font-main); }
    .status-filters { display: flex; gap: 8px; }
    .filter-btn { padding: 8px 16px; background: none; border: 1px solid var(--color-border); border-radius: 20px; color: var(--color-text-muted); font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-main); transition: all var(--transition); }
    .filter-btn.active, .filter-btn:hover { background: var(--color-primary-dim); border-color: var(--color-primary); color: var(--color-primary); }
    .sessions-table { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    .t-head { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr 1fr 1fr; gap: 12px; padding: 14px 20px; background: var(--color-surface-2); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .t-row { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr 1fr 1fr 1fr; gap: 12px; padding: 14px 20px; align-items: center; border-top: 1px solid var(--color-border); transition: background var(--transition); font-size: 14px; }
    .t-row:hover { background: var(--color-surface-2); }
    .u-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-dim); color: var(--color-primary); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .test-name { font-size: 13px; color: var(--color-text-muted); }
    .ts-time { font-size: 12px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .score-cell { font-family: var(--font-mono); font-size: 13px; }
    .text-muted { color: var(--color-text-dim); }
    .violations-cell { font-family: var(--font-mono); font-weight: 700; }
    .violations-cell.danger { color: var(--color-danger); }
    .actions-cell { display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 6px; border-radius: var(--radius-sm); display: flex; align-items: center; transition: all var(--transition); text-decoration: none; }
    .icon-btn:hover { background: var(--color-primary-dim); color: var(--color-primary); }
    .icon-btn.danger:hover { background: rgba(247,95,79,0.1); color: var(--color-danger); }
    .icon-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .empty-copy { margin-top: 8px; color: var(--color-text-muted); font-size: 13px; text-align: center; }
  `]
})
export class SessionsComponent implements OnInit {
  sessions: TestSession[] = []; loading = true; searchQuery = ''; selectedStatus = 'All';
  statusFilters = ['All', 'Active', 'Completed', 'Suspended'];

  get filteredSessions(): TestSession[] {
    return this.sessions.filter(s => {
      const matchSearch = s.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) || s.testTitle.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.selectedStatus === 'All' || s.status === this.selectedStatus;
      return matchSearch && matchStatus;
    });
  }

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {}
  ngOnInit(): void { this.adminService.getAllSessions().subscribe({ next: s => { this.sessions = s; this.loading = false; }, error: () => this.loading = false }); }

  suspendSession(s: TestSession): void {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;
    this.adminService.suspendSession({ sessionId: s.id, reason }).subscribe({ next: () => { this.snackBar.open('Session suspended', 'OK'); s.status = 'Suspended'; }, error: () => this.snackBar.open('Failed to suspend', 'Close') });
  }
}
