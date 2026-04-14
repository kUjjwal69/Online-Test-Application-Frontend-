import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { Test, CreateTestRequest } from '../../../shared/models/models';

@Component({
  selector: 'app-test-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ isEdit ? 'Edit Test' : 'Create New Test' }}</h2>
        <button class="close-btn" (click)="dialogRef.close()">✕</button>
      </div>

      <form #testForm="ngForm" (ngSubmit)="onSubmit()" class="dialog-form">
        <div class="form-row">
          <div class="form-group">
            <label>Test Title *</label>
            <input type="text" name="title" [(ngModel)]="form.title" required placeholder="e.g. JavaScript Fundamentals" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" [(ngModel)]="form.description" placeholder="Brief description of this test" rows="3"></textarea>
          </div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label>Duration (minutes) *</label>
            <input type="number" name="durationMinutes" [(ngModel)]="form.durationMinutes" required min="1" max="480" />
          </div>
          <div class="form-group">
            <label>Total Marks *</label>
            <input type="number" name="totalMarks" [(ngModel)]="form.totalMarks" required min="1" />
          </div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label>Passing Marks *</label>
            <input type="number" name="passingMarks" [(ngModel)]="form.passingMarks" required min="0" />
          </div>
          <div class="form-group">
            <label>Max Violations *</label>
            <input type="number" name="maxViolations" [(ngModel)]="form.maxViolations" required min="1" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Screenshot Interval (seconds) *</label>
            <input type="number" name="screenshotIntervalSeconds" [(ngModel)]="form.screenshotIntervalSeconds" required min="10" max="300" />
          </div>
        </div>
        <div class="form-row">
          <label class="toggle-label">
            <span>Active (visible to candidates)</span>
            <input type="checkbox" name="isActive" [(ngModel)]="form.isActive" />
            <span class="toggle-switch"></span>
          </label>
        </div>

        <div class="dialog-actions">
          <button type="button" class="btn-cancel" (click)="dialogRef.close()">Cancel</button>
          <button type="submit" class="btn-submit" [disabled]="loading || testForm.invalid">
            <span *ngIf="!loading">{{ isEdit ? 'Save Changes' : 'Create Test' }}</span>
            <mat-spinner *ngIf="loading" diameter="18" strokeWidth="2"></mat-spinner>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 0; min-width: 500px; }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; border-bottom: 1px solid var(--color-border); }
    .dialog-header h2 { font-size: 20px; font-weight: 700; }
    .close-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 18px; padding: 4px; border-radius: 4px; }
    .close-btn:hover { color: var(--color-text); }
    .dialog-form { padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; }
    .form-row { display: flex; flex-direction: column; gap: 8px; }
    .form-row.cols-2 { flex-direction: row; gap: 16px; }
    .form-row.cols-2 .form-group { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .form-group input, .form-group textarea {
      padding: 10px 14px; background: var(--color-surface-2);
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      color: var(--color-text); font-size: 14px; font-family: var(--font-main); outline: none;
      transition: border-color var(--transition);
    }
    .form-group input:focus, .form-group textarea:focus { border-color: var(--color-primary); }
    .form-group textarea { resize: vertical; }
    .toggle-label { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 12px 0; }
    .toggle-label input[type=checkbox] { display: none; }
    .toggle-switch { width: 44px; height: 24px; background: var(--color-border); border-radius: 12px; position: relative; transition: background var(--transition); }
    .toggle-switch::after { content: ''; position: absolute; width: 18px; height: 18px; background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: transform var(--transition); }
    .toggle-label input:checked + .toggle-switch { background: var(--color-primary); }
    .toggle-label input:checked + .toggle-switch::after { transform: translateX(20px); }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; border-top: 1px solid var(--color-border); }
    .btn-cancel { padding: 10px 20px; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); }
    .btn-cancel:hover { border-color: var(--color-text-muted); }
    .btn-submit { padding: 10px 24px; background: var(--color-primary); border: none; border-radius: var(--radius-sm); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); display: flex; align-items: center; gap: 8px; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class TestFormDialogComponent implements OnInit {
  form: CreateTestRequest = { title: '', description: '', durationMinutes: 60, totalMarks: 100, passingMarks: 40, isActive: true, screenshotIntervalSeconds: 60, maxViolations: 3 };
  loading = false;
  get isEdit(): boolean { return !!this.data; }

  constructor(
    public dialogRef: MatDialogRef<TestFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Test | null,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.form = { title: this.data.title, description: this.data.description, durationMinutes: this.data.durationMinutes, totalMarks: this.data.totalMarks, passingMarks: this.data.passingMarks, isActive: this.data.isActive, screenshotIntervalSeconds: this.data.screenshotIntervalSeconds, maxViolations: this.data.maxViolations };
    }
  }

  onSubmit(): void {
    this.loading = true;
    const obs = this.isEdit ? this.adminService.updateTest(this.data!.id, this.form) : this.adminService.createTest(this.form);
    obs.subscribe({
      next: () => { this.loading = false; this.snackBar.open(this.isEdit ? 'Test updated!' : 'Test created!', 'OK'); this.dialogRef.close(true); },
      error: (err) => { this.loading = false; this.snackBar.open(err.error?.message || 'Operation failed', 'Close'); }
    });
  }
}
