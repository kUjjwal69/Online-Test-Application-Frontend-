import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { User, Test, TestAssignment } from '../../../shared/models/models';

@Component({
  selector: 'app-assign-test-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ data.mode === 'remove' ? 'Remove Assigned Tests' : 'Assign Test' }}</h2>
        <button class="close-btn" (click)="dialogRef.close()">✕</button>
      </div>
      <div class="dialog-body">
        <div class="user-info-box">
          <div class="avatar">{{ getUserInitial() }}</div>
          <div>
            <div class="u-name">{{ getUserDisplayName() }}</div>
            <div class="u-email">{{ data.user.email || '-' }}</div>
          </div>
        </div>
        <div class="form-group" *ngIf="data.mode !== 'remove'">
          <label>Select Test *</label>
          <select [(ngModel)]="selectedTestId">
            <option value="">-- Choose a test --</option>
            <option *ngFor="let t of data.tests" [value]="t.id">{{ t.title }}</option>
          </select>
        </div>
        <div class="form-group" *ngIf="data.mode !== 'remove'">
          <label>Expires At (optional)</label>
          <input type="datetime-local" [(ngModel)]="expiresAt" />
        </div>

        <div class="assigned-section" *ngIf="!loadingAssignments">
          <label>Assigned Tests</label>
          <div class="assigned-list" *ngIf="userAssignments.length > 0">
            <div class="assigned-row" *ngFor="let assignment of userAssignments">
              <div class="assigned-meta">
                <div class="assigned-title">{{ assignment.testTitle || 'Untitled Test' }}</div>
                <div class="assigned-sub">Status: {{ assignment.status }}</div>
              </div>
              <button
                type="button"
                class="icon-btn danger"
                (click)="removeAssignment(assignment)"
                [disabled]="removingAssignmentId === assignment.id || loading"
                title="Remove test assignment">
                <mat-icon *ngIf="removingAssignmentId !== assignment.id">delete</mat-icon>
                <mat-spinner *ngIf="removingAssignmentId === assignment.id" diameter="16" strokeWidth="2"></mat-spinner>
              </button>
            </div>
          </div>
          <div class="assigned-empty" *ngIf="userAssignments.length === 0">
            No tests assigned yet.
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn-cancel" (click)="dialogRef.close()">Cancel</button>
        <button class="btn-submit" *ngIf="data.mode !== 'remove'" [disabled]="!selectedTestId || loading" (click)="assign()">
          <mat-spinner *ngIf="loading" diameter="16" strokeWidth="2"></mat-spinner>
          {{ loading ? 'Assigning...' : 'Assign Test' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { min-width: 440px; }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; border-bottom: 1px solid var(--color-border); }
    .dialog-header h2 { font-size: 20px; font-weight: 700; }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 18px; }
    .dialog-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; }
    .user-info-box { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--color-surface-2); border-radius: var(--radius-sm); }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-dim); color: var(--color-primary); font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .u-name { font-weight: 600; }
    .u-email { font-size: 13px; color: var(--color-text-muted); }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .form-group select, .form-group input { padding: 10px 14px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px; font-family: var(--font-main); outline: none; }
    .form-group select:focus, .form-group input:focus { border-color: var(--color-primary); }
    .form-group select option { background: var(--color-surface); }
    .assigned-section { margin-top: 4px; }
    .assigned-list { display: flex; flex-direction: column; gap: 8px; }
    .assigned-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface-2); }
    .assigned-title { font-size: 14px; font-weight: 600; }
    .assigned-sub { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
    .assigned-empty { color: var(--color-text-muted); font-size: 13px; padding: 8px 0; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .icon-btn.danger:hover { color: var(--color-danger); background: rgba(247,95,79,0.12); }
    .icon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .icon-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 28px; border-top: 1px solid var(--color-border); }
    .btn-cancel { padding: 10px 20px; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); }
    .btn-submit { padding: 10px 24px; background: var(--color-primary); border: none; border-radius: var(--radius-sm); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); display: flex; align-items: center; gap: 8px; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class AssignTestDialogComponent implements OnInit {
  selectedTestId = ''; expiresAt = ''; loading = false;
  loadingAssignments = false;
  removingAssignmentId = '';
  userAssignments: TestAssignment[] = [];
  constructor(public dialogRef: MatDialogRef<AssignTestDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { user: User; tests: Test[]; mode?: 'assign' | 'remove' }, private adminService: AdminService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadUserAssignments();
  }

  assign(): void {
    if (this.data.mode === 'remove') return;
    const userId = this.getUserId();
    if (!userId) {
      this.snackBar.open('User id is missing. Cannot assign test.', 'Close');
      return;
    }

    console.log('[AssignTestDialog.assign]', {
      testId: this.selectedTestId,
      userId,
      user: this.data.user
    });

    this.loading = true;
    this.adminService.assignTest({
      testId: this.selectedTestId,
      userId,
      userIds: [userId],
      expiresAt: this.expiresAt || undefined
    }).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Test assigned!', 'OK');
        this.loadUserAssignments();
      },
      error: (err) => { this.loading = false; this.snackBar.open(err.error?.message || 'Assignment failed', 'Close'); }
    });
  }

  removeAssignment(assignment: TestAssignment): void {
    const testId = assignment.testId || assignment.id;
    if (!testId) return;
    if (!confirm(`Remove "${assignment.testTitle}" from this user?`)) return;

    this.removingAssignmentId = assignment.id || testId;
    this.adminService.deleteAssignment(testId).subscribe({
      next: () => {
        this.removingAssignmentId = '';
        this.snackBar.open('Assignment removed', 'OK');
        this.loadUserAssignments();
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.removingAssignmentId = '';
        this.snackBar.open(err.error?.message || 'Failed to remove assignment', 'Close');
      }
    });
  }

  getUserDisplayName(): string {
    const user = this.data.user as User & { username?: string; name?: string };
    return this.data.user.fullName || user.name || user.username || this.data.user.email || 'Unknown User';
  }

  getUserInitial(): string {
    return this.getUserDisplayName().charAt(0).toUpperCase();
  }

  private getUserId(): string {
    const user = this.data.user as User & { userId?: string };
    return this.data.user.id || user.userId || '';
  }

  private loadUserAssignments(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.userAssignments = [];
      return;
    }

    this.loadingAssignments = true;
    this.adminService.getAllAssignments().subscribe({
      next: assignments => {
        this.userAssignments = assignments.filter(a => a.userId === userId);
        this.loadingAssignments = false;
      },
      error: () => {
        this.userAssignments = [];
        this.loadingAssignments = false;
      }
    });
  }
}
