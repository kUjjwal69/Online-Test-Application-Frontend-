import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { Test, CreateTestRequest } from '../../../shared/models/models';
import { TestFormDialogComponent } from './test-form-dialog.component';

@Component({
  selector: 'app-tests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <div class="ph-left">
        <h1>Manage Tests</h1>
        <p>Create and manage examination tests</p>
      </div>
      <button class="btn-primary mat-button" (click)="openCreate()">
        <mat-icon>add</mat-icon> Create Test
      </button>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
      <mat-spinner diameter="48"></mat-spinner>
    </div>

    <div class="tests-grid" *ngIf="!loading">
      <div class="test-card" *ngFor="let test of tests">
        <div class="tc-header">
          <div class="tc-status">
            <span class="status-chip" [ngClass]="test.isActive ? 'active' : 'pending'">
              {{ test.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="tc-actions">
            <button class="icon-btn" (click)="openEdit(test)" matTooltip="Edit"><mat-icon>edit</mat-icon></button>
            <button class="icon-btn danger" (click)="deleteTest(test)" matTooltip="Delete"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
        <h3 class="tc-title">{{ test.title }}</h3>
        <p class="tc-desc">{{ test.description }}</p>
        <div class="tc-stats">
          <div class="tc-stat"><mat-icon>timer</mat-icon> {{ test.durationMinutes }}m</div>
          <div class="tc-stat"><mat-icon>stars</mat-icon> {{ test.totalMarks }} marks</div>
          <div class="tc-stat"><mat-icon>quiz</mat-icon> {{ test.questionCount || 0 }} Q</div>
        </div>
        <div class="tc-footer">
          <a [routerLink]="['/admin/tests', test.id, 'questions']" class="tc-link">
            <mat-icon>list</mat-icon> Manage Questions
          </a>
          <span class="tc-date">{{ test.createdAt | date:'mediumDate' }}</span>
        </div>
      </div>
    </div>

    <div class="empty-state" *ngIf="!loading && tests.length === 0">
      <mat-icon>quiz</mat-icon>
      <h3>No tests created yet</h3>
      <p>Create your first test to get started</p>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
    .ph-left h1 { font-size: 26px; font-weight: 700; }
    .ph-left p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); transition: all var(--transition); }
    .btn-primary:hover { background: #6aa0ff; transform: translateY(-1px); }
    .btn-primary mat-icon { font-size: 18px !important; width: 18px; height: 18px; }

    .tests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .test-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: 24px; transition: all var(--transition); }
    .test-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-glow); }
    .tc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .tc-actions { display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 6px; border-radius: var(--radius-sm); display: flex; align-items: center; transition: all var(--transition); }
    .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text); }
    .icon-btn.danger:hover { background: rgba(247,95,79,0.1); color: var(--color-danger); }
    .icon-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .tc-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .tc-desc { font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tc-stats { display: flex; gap: 16px; margin-bottom: 16px; padding: 12px; background: var(--color-surface-2); border-radius: var(--radius-sm); }
    .tc-stat { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-text-muted); }
    .tc-stat mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .tc-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--color-border); }
    .tc-link { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--color-primary); }
    .tc-link mat-icon { font-size: 16px !important; width: 16px; height: 16px; }
    .tc-date { font-size: 11px; color: var(--color-text-dim); font-family: var(--font-mono); }
  `]
})
export class TestsComponent implements OnInit {
  tests: Test[] = [];
  loading = true;

  constructor(private adminService: AdminService, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.loadTests(); }

  loadTests(): void {
    this.loading = true;
    this.adminService.getAllTests().subscribe({ next: t => { this.tests = t; this.loading = false; }, error: () => this.loading = false });
  }

  openCreate(): void {
    const ref = this.dialog.open(TestFormDialogComponent, { width: '600px', data: null });
    ref.afterClosed().subscribe(result => { if (result) this.loadTests(); });
  }

  openEdit(test: Test): void {
    const ref = this.dialog.open(TestFormDialogComponent, { width: '600px', data: test });
    ref.afterClosed().subscribe(result => { if (result) this.loadTests(); });
  }

  deleteTest(test: Test): void {
    if (!confirm(`Delete "${test.title}"? This cannot be undone.`)) return;
    this.adminService.deleteTest(test.id).subscribe({
      next: () => { this.snackBar.open('Test deleted', 'OK'); this.loadTests(); },
      error: () => this.snackBar.open('Failed to delete test', 'Close')
    });
  }
}
