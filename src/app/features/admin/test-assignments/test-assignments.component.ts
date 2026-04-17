import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { Test, TestAssignment, User } from '../../../shared/models/models';

interface TestGroup {
  test: Test;
  assignments: TestAssignment[];
}

@Component({
  selector: 'app-test-assignments',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <h1>Test Assignments</h1>
      <p>View test-wise assigned users and remove them when required.</p>
    </div>

    <div *ngIf="loading" class="loading-wrap">
      <mat-spinner diameter="44"></mat-spinner>
    </div>

    <div class="table-card" *ngIf="!loading">
      <div class="table-head">
        <span>Test</span>
        <span>Assigned Users</span>
        <span></span>
      </div>

      <div class="test-row" *ngFor="let group of testGroups">
        <div class="test-name">{{ group.test.title }}</div>
        <div class="test-count">{{ group.assignments.length }}</div>
        <button class="expand-btn" (click)="toggle(group.test.id)" [title]="isExpanded(group.test.id) ? 'Hide assigned users' : 'Show assigned users'">
          <mat-icon>{{ isExpanded(group.test.id) ? 'expand_more' : 'chevron_right' }}</mat-icon>
        </button>

        <div class="users-panel" *ngIf="isExpanded(group.test.id)">
          <div class="empty-state" *ngIf="group.assignments.length === 0">
            <mat-icon>person_off</mat-icon>
            <p>No users assigned to this test.</p>
          </div>

          <div class="user-row" *ngFor="let a of group.assignments">
            <div>
              <div class="user-name">{{ getAssignmentUserName(a) }}</div>
              <div class="user-email">{{ getAssignmentUserEmail(a) }}</div>
            </div>
            <button
              class="remove-user-btn"
              [disabled]="removingKey === buildRemoveKey(group.test.id, resolveAssignmentUserId(a) || '')"
              (click)="removeUser(group.test.id, a)">
              <mat-icon *ngIf="removingKey !== buildRemoveKey(group.test.id, resolveAssignmentUserId(a) || '')">delete</mat-icon>
              <mat-spinner *ngIf="removingKey === buildRemoveKey(group.test.id, resolveAssignmentUserId(a) || '')" diameter="16" strokeWidth="2"></mat-spinner>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-wrap { display: flex; justify-content: center; padding: 80px 0; }
    .table-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    .table-head { display: grid; grid-template-columns: 2fr 1fr 56px; gap: 12px; padding: 14px 18px; background: var(--color-surface-2); color: var(--color-text-muted); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .test-row { display: grid; grid-template-columns: 2fr 1fr 56px; gap: 12px; align-items: center; border-top: 1px solid var(--color-border); padding: 12px 18px; }
    .test-name { font-weight: 600; }
    .test-count { color: var(--color-text-muted); font-family: var(--font-mono); }
    .expand-btn { width: 32px; height: 32px; border: 1px solid var(--color-border); background: none; color: var(--color-text-muted); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .expand-btn:hover { color: var(--color-primary); border-color: var(--color-primary); background: var(--color-primary-dim); }
    .users-panel { grid-column: 1 / -1; margin-top: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface-2); padding: 10px; }
    .user-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 8px; border-bottom: 1px solid var(--color-border); }
    .user-row:last-child { border-bottom: none; }
    .user-name { font-size: 14px; font-weight: 600; }
    .user-email { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
    .remove-user-btn { width: 34px; height: 34px; border: 1px solid rgba(247,95,79,0.35); color: var(--color-danger); border-radius: 50%; background: rgba(247,95,79,0.12); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .remove-user-btn:hover:not(:disabled) { background: rgba(247,95,79,0.22); }
    .remove-user-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .empty-state { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); padding: 8px; }
  `]
})
export class TestAssignmentsComponent implements OnInit {
  loading = true;
  expandedTestId = '';
  removingKey = '';
  testGroups: TestGroup[] = [];
  private userLookup = new Map<string, User>();

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  toggle(testId: string): void {
    this.expandedTestId = this.expandedTestId === testId ? '' : testId;
  }

  isExpanded(testId: string): boolean {
    return this.expandedTestId === testId;
  }

  buildRemoveKey(testId: string, userId: string): string {
    return `${testId}:${userId}`;
  }

  removeUser(testId: string, assignment: TestAssignment): void {
    const userId = this.resolveAssignmentUserId(assignment);
    if (!userId) {
      this.snackBar.open('User id missing in assignment payload.', 'Close');
      return;
    }
    const userName = this.getAssignmentUserName(assignment);
    if (!confirm(`Remove ${userName} from this test?`)) return;

    const key = this.buildRemoveKey(testId, userId);
    this.removingKey = key;
    this.adminService.deleteAssignment(testId, userId).subscribe({
      next: () => {
        this.removingKey = '';
        this.testGroups = this.testGroups.map(group => {
          if (group.test.id !== testId) return group;
          return { ...group, assignments: group.assignments.filter(a => a.userId !== userId) };
        });
        this.snackBar.open('User removed from test', 'OK');
      },
      error: (err) => {
        this.removingKey = '';
        this.snackBar.open(err.error?.message || 'Failed to remove user from test', 'Close');
      }
    });
  }

  private loadData(): void {
    this.loading = true;
    forkJoin({
      tests: this.adminService.getAllTests(),
      assignments: this.adminService.getAllAssignments(),
      users: this.adminService.getAllUsers()
    }).subscribe({
      next: ({ tests, assignments, users }) => {
        this.userLookup = new Map(users.map(user => [user.id, user]));
        this.testGroups = tests.map(test => ({
          test,
          assignments: assignments.filter(a => a.testId === test.id)
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getAssignmentUserName(assignment: TestAssignment): string {
    const lookupUser = this.resolveUserForAssignment(assignment);
    const candidate = lookupUser as User & { username?: string; name?: string };
    return assignment.userName || lookupUser?.fullName || candidate?.name || candidate?.username || lookupUser?.email || assignment.userEmail || 'Unknown User';
  }

  getAssignmentUserEmail(assignment: TestAssignment): string {
    const lookupUser = this.resolveUserForAssignment(assignment);
    return assignment.userEmail || lookupUser?.email || '-';
  }

  resolveAssignmentUserId(assignment: TestAssignment): string | null {
    if (assignment.userId) return assignment.userId;
    return this.resolveUserForAssignment(assignment)?.id || null;
  }

  private resolveUserForAssignment(assignment: TestAssignment): User | null {
    if (assignment.userId && this.userLookup.has(assignment.userId)) {
      return this.userLookup.get(assignment.userId) || null;
    }

    const nameHint = (assignment.userName || '').trim().toLowerCase();
    const emailHint = (assignment.userEmail || '').trim().toLowerCase();

    if (emailHint) {
      const byEmail = Array.from(this.userLookup.values()).find(user => (user.email || '').trim().toLowerCase() === emailHint);
      if (byEmail) return byEmail;
    }

    if (nameHint) {
      const byName = Array.from(this.userLookup.values()).find(user => this.getUserDisplayName(user).trim().toLowerCase() === nameHint);
      if (byName) return byName;
    }

    return null;
  }

  private getUserDisplayName(user: User): string {
    const candidate = user as User & { username?: string; name?: string };
    return user.fullName || candidate.name || candidate.username || user.email || 'Unknown User';
  }
}
