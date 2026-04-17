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
        <h2>User Test Management</h2>
        <button class="close-btn" (click)="dialogRef.close()">✕</button>
      </div>
      <div class="dialog-body">
        <div class="section-card">
          <div class="user-info-box">
            <div class="avatar">{{ getUserInitial() }}</div>
            <div class="user-info-content">
              <div class="info-row"><span class="label">User:</span> <span class="value">{{ getUserDisplayName() }}</span></div>
              <div class="info-row"><span class="label">Email:</span> <span class="value">{{ data.user.email || '-' }}</span></div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">
                  <span class="status-chip" [ngClass]="data.user.isActive ? 'active' : 'inactive'">
                    {{ data.user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card assigned-section">
          <h3>Assigned Tests</h3>
          <div class="assigned-loading" *ngIf="loadingAssignments">
            <mat-spinner diameter="20" strokeWidth="3"></mat-spinner>
            <span>Loading assignments...</span>
          </div>
          <div class="assigned-list" *ngIf="!loadingAssignments && userAssignments.length > 0">
            <div class="assigned-row" *ngFor="let assignment of userAssignments">
              <div class="assigned-meta" [title]="assignment.testTitle || resolveAssignedTestTitle(assignment)">
                <div class="assigned-title">{{ assignment.testTitle || 'Untitled Test' }}</div>
                <div class="assigned-sub">Status: {{ assignment.status || 'Assigned' }}</div>
              </div>
              <button
                type="button"
                class="remove-btn"
                (click)="removeAssignment(assignment)"
                [disabled]="removingAssignmentId === assignment.id || loading"
                title="Remove test assignment">
                <span class="remove-content" *ngIf="removingAssignmentId !== assignment.id">
                  <mat-icon>delete</mat-icon>
                  Remove
                </span>
                <mat-spinner *ngIf="removingAssignmentId === assignment.id" diameter="14" strokeWidth="2"></mat-spinner>
              </button>
            </div>
          </div>
          <div class="assigned-empty" *ngIf="!loadingAssignments && userAssignments.length === 0">
            No tests assigned yet.
          </div>

          <div class="assign-panel" *ngIf="data.mode !== 'remove'">
            <div class="assign-header">Assign New Test</div>
            <div class="assign-grid">
              <div class="form-group">
                <label>Select Test *</label>
                <select [(ngModel)]="selectedTestId" (focus)="loadTestsIfNeeded()" (click)="loadTestsIfNeeded()">
                  <option value="">-- Choose a test --</option>
                  <option value="" disabled *ngIf="loadingTests">Loading tests...</option>
                  <option *ngFor="let t of availableTests" [value]="t.id">{{ t.title }}</option>
                </select>
                <div class="field-error" *ngIf="showValidationErrors && !selectedTestId">Please select a test.</div>
              </div>
              <div class="form-group">
                <label>Expires At (optional)</label>
                <input type="date" [(ngModel)]="expiresAt" [min]="minExpiryDate" />
                <div class="field-error" *ngIf="showValidationErrors && isExpiryInvalid()">
                  Expiry date cannot be in the past.
                </div>
              </div>
            </div>
            <button class="btn-submit full-width" [disabled]="isAssignDisabled()" (click)="assign()">
              <mat-spinner *ngIf="loading" diameter="16" strokeWidth="2"></mat-spinner>
              {{ loading ? 'Assigning...' : '+ Assign New Test' }}
            </button>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn-cancel" (click)="dialogRef.close()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { min-width: 520px; }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; border-bottom: 1px solid var(--color-border); }
    .dialog-header h2 { font-size: 20px; font-weight: 700; }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 18px; }
    .dialog-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto; }
    .section-card { border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface-2); padding: 14px; }
    .user-info-box { display: flex; align-items: flex-start; gap: 14px; }
    .user-info-content { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .info-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 14px; }
    .label { color: var(--color-text-muted); font-weight: 600; min-width: 56px; }
    .value { color: var(--color-text); font-weight: 500; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--color-primary-dim); color: var(--color-primary); font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .status-chip { font-size: 12px; padding: 4px 10px; border-radius: 999px; font-weight: 700; }
    .status-chip.active { background: rgba(96, 221, 132, 0.18); color: #60dd84; }
    .status-chip.inactive { background: rgba(247,95,79,0.18); color: #f75f4f; }
    .assigned-section h3 { margin: 0 0 12px 0; font-size: 16px; font-weight: 700; }
    .assigned-loading { display: flex; align-items: center; gap: 10px; color: var(--color-text-muted); font-size: 13px; padding: 8px 0 14px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .form-group select, .form-group input { padding: 10px 14px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px; font-family: var(--font-main); outline: none; }
    .form-group select:focus, .form-group input:focus { border-color: var(--color-primary); }
    .form-group select option { background: var(--color-surface); }
    .field-error { color: var(--color-danger); font-size: 12px; }
    .assigned-list { display: flex; flex-direction: column; gap: 8px; }
    .assigned-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface-2); }
    .assigned-title { font-size: 14px; font-weight: 600; }
    .assigned-sub { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
    .assigned-empty { color: var(--color-text-muted); font-size: 13px; padding: 8px 0; }
    .remove-btn { background: rgba(247,95,79,0.14); border: 1px solid rgba(247,95,79,0.35); color: var(--color-danger); cursor: pointer; border-radius: var(--radius-sm); padding: 6px 10px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; min-width: 84px; }
    .remove-content { display: flex; align-items: center; gap: 6px; }
    .remove-content mat-icon { width: 16px; height: 16px; font-size: 16px; }
    .remove-btn:hover:not(:disabled) { background: rgba(247,95,79,0.2); }
    .remove-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .assign-panel { margin-top: 14px; border-top: 1px dashed var(--color-border); padding-top: 14px; }
    .assign-header { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); font-weight: 700; margin-bottom: 10px; }
    .assign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 28px; border-top: 1px solid var(--color-border); }
    .btn-cancel { padding: 10px 20px; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); }
    .btn-submit { padding: 10px 24px; background: var(--color-primary); border: none; border-radius: var(--radius-sm); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); display: flex; align-items: center; gap: 8px; }
    .btn-submit.full-width { width: 100%; justify-content: center; margin-top: 12px; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    @media (max-width: 700px) {
      .dialog-container { min-width: auto; width: 100%; }
      .assign-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AssignTestDialogComponent implements OnInit {
  selectedTestId = ''; expiresAt = ''; loading = false;
  showValidationErrors = false;
  loadingAssignments = false;
  loadingTests = false;
  removingAssignmentId = '';
  userAssignments: TestAssignment[] = [];
  availableTests: Test[] = [];
  readonly minExpiryDate = this.formatDateForInput(new Date());
  constructor(
    public dialogRef: MatDialogRef<AssignTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User; tests: Test[]; mode?: 'assign' | 'remove'; userAssignments?: TestAssignment[] },
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.availableTests = this.data.tests ?? [];
    
    // Always fetch fresh assignments from the backend to ensure local persistence
    const userId = this.getUserId();
    if (userId) {
      this.loadingAssignments = true;
      this.adminService.getUserAssignments(userId).subscribe({
        next: (assignments) => {
          this.userAssignments = assignments.map(a => ({
            ...a,
            testTitle: a.testTitle || this.resolveAssignedTestTitle(a)
          }));
          this.loadingAssignments = false;
        },
        error: () => {
          this.loadingAssignments = false;
          // Fallback to data passed in if API fails
          this.userAssignments = (this.data.userAssignments ?? [])
            .map(a => ({ ...a, testTitle: a.testTitle || this.resolveAssignedTestTitle(a) }));
        }
      });
    } else {
      this.userAssignments = (this.data.userAssignments ?? [])
        .map(a => ({ ...a, testTitle: a.testTitle || this.resolveAssignedTestTitle(a) }));
    }
  }

  assign(): void {
    if (this.data.mode === 'remove') return;
    this.showValidationErrors = true;
    if (this.isAssignDisabled()) return;

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
    const expiresAt = this.expiresAt ? `${this.expiresAt}T23:59:59` : undefined;
    this.adminService.assignTest({
      testId: this.selectedTestId,
      userId,
      userIds: [userId],
      expiresAt
    }).subscribe({
      next: () => {
        this.loading = false;
        const selectedTest = this.availableTests.find(t => t.id === this.selectedTestId);
        this.userAssignments = [
          {
            id: `${this.selectedTestId}-${userId}-${Date.now()}`,
            testId: this.selectedTestId,
            userId,
            testTitle: selectedTest?.title || 'Untitled Test',
            userName: this.getUserDisplayName(),
            userEmail: this.data.user.email || '',
            assignedAt: new Date().toISOString(),
            expiresAt,
            status: 'NotStarted'
          },
          ...this.userAssignments.filter(a => a.testId !== this.selectedTestId)
        ];
        this.selectedTestId = '';
        this.expiresAt = '';
        this.showValidationErrors = false;
        this.snackBar.open('Test assigned!', 'OK');
      },
      error: (err) => {
        this.loading = false;
        const apiErrors = err?.error?.errors;
        const detailedError = Array.isArray(apiErrors)
          ? apiErrors.join(', ')
          : typeof apiErrors === 'object' && apiErrors
            ? Object.values(apiErrors).flat().join(', ')
            : '';
        this.snackBar.open(detailedError || err.error?.message || 'Assignment failed', 'Close');
      }
    });
  }

  removeAssignment(assignment: TestAssignment): void {
    const testId = assignment.testId || assignment.id;
    if (!testId) return;
    const testTitle = assignment.testTitle || this.resolveAssignedTestTitle(assignment);
    if (!confirm(`Remove "${testTitle}" from this user?`)) return;

    const userId = this.getUserId();
    if (!userId) return;

    this.removingAssignmentId = assignment.id || testId;
    this.adminService.deleteAssignment(testId, userId).subscribe({
      next: () => {
        this.removingAssignmentId = '';
        this.userAssignments = this.userAssignments.filter(a => (a.id || a.testId) !== (assignment.id || assignment.testId));
        this.snackBar.open('Assignment removed', 'OK');
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

  resolveAssignedTestTitle(assignment: TestAssignment): string {
    const foundTest = this.availableTests.find(t => t.id === assignment.testId || t.id === assignment.id);
    return foundTest?.title || 'Untitled Test';
  }

  loadTestsIfNeeded(): void {
    if (this.loadingTests || this.availableTests.length > 0) return;

    this.loadingTests = true;
    this.adminService.getAllTests().subscribe({
      next: tests => {
        this.availableTests = tests;
        this.loadingTests = false;
      },
      error: () => {
        this.loadingTests = false;
        this.snackBar.open('Unable to load tests', 'Close');
      }
    });
  }

  isAssignDisabled(): boolean {
    return this.loading || !this.selectedTestId || this.isExpiryInvalid();
  }

  isExpiryInvalid(): boolean {
    if (!this.expiresAt) return false;

    const selectedDate = new Date(`${this.expiresAt}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
