import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CandidateService } from '../../../core/services/candidate.service';
import { TestAssignment } from '../../../shared/models/models';

@Component({
  selector: 'app-test-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header" style="margin-bottom:28px">
      <h1>My Tests</h1>
      <p>All tests assigned to you</p>
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px">
      <mat-spinner diameter="48"></mat-spinner>
    </div>

    <div class="filter-bar" *ngIf="!loading">
      <button *ngFor="let s of statusFilters" class="filter-btn"
        [class.active]="selectedStatus === s" (click)="selectedStatus = s">
        {{ s }}
      </button>
    </div>

    <div class="assignments-list" *ngIf="!loading">
      <div class="assignment-card" *ngFor="let a of filteredAssignments">
        <div class="ac-left">
          <div class="ac-icon" [ngClass]="a.status">
            <mat-icon>{{ iconFor(a.status) }}</mat-icon>
          </div>
          <div class="ac-info">
            <h3>{{ a.testTitle }}</h3>
            <div class="ac-meta">
              <span>Assigned {{ a.assignedAt | date:'mediumDate' }}</span>
              <span *ngIf="a.expiresAt" class="expires">
                <mat-icon style="font-size:14px;width:14px;height:14px">schedule</mat-icon>
                Expires {{ a.expiresAt | date:'mediumDate' }}
              </span>
            </div>
          </div>
        </div>
        <div class="ac-right">
          <span class="status-chip" [ngClass]="chipClass(a.status)">{{ labelFor(a.status) }}</span>
          <button class="start-btn"
            *ngIf="a.status === 'NotStarted'"
            (click)="startTest(a)"
            [disabled]="startingId === a.id">
            <mat-spinner *ngIf="startingId === a.id" diameter="16" strokeWidth="2"></mat-spinner>
            <mat-icon *ngIf="startingId !== a.id">play_arrow</mat-icon>
            {{ startingId === a.id ? 'Starting...' : 'Start Test' }}
          </button>
          <button class="resume-btn"
            *ngIf="a.status === 'InProgress'"
            (click)="startTest(a)">
            <mat-icon>play_circle</mat-icon> Resume
          </button>
        </div>
      </div>

      <div class="empty-state" *ngIf="filteredAssignments.length === 0">
        <mat-icon>assignment_turned_in</mat-icon>
        <h3>No tests found</h3>
        <p>No tests match the selected filter</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header h1 { font-size: 26px; font-weight: 700; }
    .page-header p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }

    .filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-btn {
      padding: 7px 18px; background: none; border: 1px solid var(--color-border);
      border-radius: 20px; color: var(--color-text-muted); font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: var(--font-main); transition: all var(--transition);
    }
    .filter-btn.active { background: var(--color-primary-dim); border-color: var(--color-primary); color: var(--color-primary); }

    .assignments-list { display: flex; flex-direction: column; gap: 12px; }
    .assignment-card {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius); padding: 20px 24px;
      transition: all var(--transition);
    }
    .assignment-card:hover { border-color: rgba(79,142,247,0.4); box-shadow: 0 2px 16px rgba(0,0,0,0.2); }

    .ac-left { display: flex; align-items: center; gap: 16px; }
    .ac-icon {
      width: 48px; height: 48px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ac-icon mat-icon { font-size: 22px !important; width: 22px; height: 22px; }
    .ac-icon.notstarted { background: rgba(107,116,148,0.15); color: var(--color-text-muted); }
    .ac-icon.inprogress { background: rgba(247,193,79,0.15); color: var(--color-warning); }
    .ac-icon.completed { background: rgba(61,214,140,0.15); color: var(--color-success); }
    .ac-icon.suspended { background: rgba(247,95,79,0.15); color: var(--color-danger); }

    .ac-info h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .ac-meta { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--color-text-muted); }
    .expires { display: flex; align-items: center; gap: 4px; color: var(--color-warning); }

    .ac-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .start-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 20px; background: var(--color-primary); color: #fff;
      border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: var(--font-main); transition: all var(--transition);
    }
    .start-btn:hover:not(:disabled) { background: #6aa0ff; transform: translateY(-1px); }
    .start-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .start-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
    .resume-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 20px; background: rgba(247,193,79,0.15); color: var(--color-warning);
      border: 1px solid rgba(247,193,79,0.3); border-radius: var(--radius-sm);
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-main); transition: all var(--transition);
    }
    .resume-btn:hover { background: rgba(247,193,79,0.25); }
    .resume-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
  `]
})
export class TestListComponent implements OnInit {
  assignments: TestAssignment[] = [];
  loading = true;
  startingId = '';
  selectedStatus = 'All';
  statusFilters = ['All', 'NotStarted', 'InProgress', 'Completed', 'Suspended'];

  get filteredAssignments(): TestAssignment[] {
    const assignments = Array.isArray(this.assignments) ? this.assignments : [];
    if (this.selectedStatus === 'All') return assignments;
    return assignments.filter(a => a.status === this.selectedStatus);
  }

  constructor(
    private candidateService: CandidateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.candidateService.getMyAssignments().subscribe({
      next: a => { this.assignments = Array.isArray(a) ? a : []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  startTest(assignment: TestAssignment): void {
    this.startingId = assignment.id;
    this.candidateService.startSession({ testId: assignment.testId || assignment.id }).subscribe({
      next: (session) => {
        this.startingId = '';
        this.router.navigate(['/exam/session'], { state: { session } });
      },
      error: (err) => {
        this.startingId = '';
        this.snackBar.open(err.error?.message || 'Failed to start session', 'Close');
      }
    });
  }

  iconFor(status: string): string {
    const icons: Record<string, string> = {
      NotStarted: 'pending', InProgress: 'play_circle',
      Completed: 'check_circle', Suspended: 'block'
    };
    return icons[status] || 'assignment';
  }

  labelFor(status: string): string {
    const labels: Record<string, string> = {
      NotStarted: 'Not Started', InProgress: 'In Progress',
      Completed: 'Completed', Suspended: 'Suspended'
    };
    return labels[status] || status;
  }

  chipClass(status: string): string {
    const map: Record<string, string> = {
      NotStarted: 'not-started', InProgress: 'active',
      Completed: 'completed', Suspended: 'suspended'
    };
    return map[status] || '';
  }
}
