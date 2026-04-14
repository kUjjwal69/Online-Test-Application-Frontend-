import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of, switchMap } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../shared/models/models';
import { AssignTestDialogComponent } from './assign-test-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <div class="page-header" style="margin-bottom:28px">
      <h1>Candidates</h1>
      <p>Manage registered candidates and assign tests</p>
    </div>

    <div class="search-bar">
      <mat-icon>search</mat-icon>
      <input type="text" placeholder="Search by name or email..." [(ngModel)]="searchQuery" />
    </div>

    <div *ngIf="loading" style="display:flex;justify-content:center;padding:60px"><mat-spinner diameter="48"></mat-spinner></div>

    <div class="users-table" *ngIf="!loading">
      <div class="table-header">
        <span>Candidate</span>
        <span>Email</span>
        <span>Status</span>
        <span>Joined</span>
        <span>Actions</span>
      </div>
      <div class="table-row" *ngFor="let u of filteredUsers">
        <div class="user-cell">
          <div class="avatar">{{ getUserInitial(u) }}</div>
          <span class="u-name">{{ getUserDisplayName(u) }}</span>
        </div>
        <span class="u-email">{{ u.email || '-' }}</span>
        <span><span class="status-chip" [ngClass]="u.isActive ? 'active' : 'suspended'">{{ u.isActive ? 'Active' : 'Inactive' }}</span></span>
        <span class="u-date">{{ u.createdAt | date:'mediumDate' }}</span>
        <div class="actions-cell">
          <button class="icon-btn" (click)="assignTest(u)" matTooltip="Assign Test">
            <mat-icon>assignment_add</mat-icon>
          </button>
          <button
            class="icon-btn danger"
            (click)="removeAssignedTests(u)"
            matTooltip="Remove Assigned Tests">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>
      <div class="empty-state" *ngIf="filteredUsers.length === 0">
        <mat-icon>group</mat-icon>
        <h3>No candidates found</h3>
      </div>
    </div>
  `,
  styles: [`
    .page-header h1 { font-size: 26px; font-weight: 700; }
    .page-header p { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
    .search-bar { display: flex; align-items: center; gap: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px; }
    .search-bar mat-icon { color: var(--color-text-muted); }
    .search-bar input { flex: 1; background: none; border: none; outline: none; color: var(--color-text); font-size: 14px; font-family: var(--font-main); }
    .users-table { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 1fr; gap: 16px; padding: 14px 20px; background: var(--color-surface-2); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .table-row { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 1fr; gap: 16px; padding: 16px 20px; align-items: center; border-top: 1px solid var(--color-border); transition: background var(--transition); }
    .table-row:hover { background: var(--color-surface-2); }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-dim); color: var(--color-primary); font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .u-name { font-weight: 600; font-size: 14px; }
    .u-email { font-size: 13px; color: var(--color-text-muted); }
    .u-date { font-size: 12px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .actions-cell { display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 6px; border-radius: var(--radius-sm); display: flex; align-items: center; transition: all var(--transition); }
    .icon-btn:hover { background: var(--color-primary-dim); color: var(--color-primary); }
    .icon-btn.danger:hover { background: rgba(247,95,79,0.12); color: var(--color-danger); }
    .icon-btn mat-icon { font-size: 18px !important; width: 18px; height: 18px; }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = []; loading = true; searchQuery = '';
  get filteredUsers(): User[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.users;

    return this.users.filter(u =>
      this.getUserDisplayName(u).toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    );
  }
  constructor(private adminService: AdminService, private dialog: MatDialog, private snackBar: MatSnackBar) {}
  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe({
      next: u => {
        const candidates = u.filter(user => this.isCandidate(user));
        this.users = candidates.length > 0 ? candidates : u;
        console.log('[UsersComponent.getAllUsers]', {
          totalReceived: u.length,
          displayed: this.users.length,
          roles: u.map(user => user.role)
        });
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
  assignTest(user: User): void {
    this.adminService.getAllTests().subscribe(tests => {
      const ref = this.dialog.open(AssignTestDialogComponent, { width: '560px', data: { user, tests, mode: 'assign' } });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.snackBar.open('Test assigned!', 'OK');
        }
      });
    });
  }

  removeAssignedTests(user: User): void {
    const userId = user.id;
    if (!userId) {
      this.snackBar.open('User id missing. Cannot remove assignments.', 'Close');
      return;
    }

    const userName = this.getUserDisplayName(user);
    if (!confirm(`Remove all assigned tests for ${userName}?`)) return;

    this.adminService.getAllAssignments().pipe(
      switchMap(assignments => {
        const userAssignments = assignments.filter(a => a.userId === userId);
        if (userAssignments.length === 0) {
          this.removeUserFromList(userId);
          this.snackBar.open('No assigned tests found. User removed from this list.', 'OK');
          return of(null);
        }

        return forkJoin(userAssignments.map(a => this.adminService.deleteAssignment(a.testId || a.id))).pipe(
          switchMap(() => of(userAssignments.length))
        );
      })
    ).subscribe({
      next: (removedCount) => {
        if (typeof removedCount === 'number') {
          this.snackBar.open(`Removed ${removedCount} assigned test(s).`, 'OK');
          this.removeUserFromList(userId);
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to remove assigned tests', 'Close');
      }
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

  getUserDisplayName(user: User): string {
    const candidate = user as User & { username?: string; name?: string };
    return user.fullName || candidate.name || candidate.username || user.email || 'Unknown User';
  }

  getUserInitial(user: User): string {
    return this.getUserDisplayName(user).charAt(0).toUpperCase();
  }

  private removeUserFromList(userId: string): void {
    this.users = this.users.filter(u => u.id !== userId);
  }
}
