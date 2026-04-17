import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../shared/models/models';
import { AssignTestDialogComponent } from './assign-test-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule],
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
        <span></span>
      </div>
      <div
        class="table-row clickable-row"
        *ngFor="let u of filteredUsers"
        (click)="openUserDetails(u)"
        tabindex="0"
        (keydown.enter)="openUserDetails(u)"
        (keydown.space)="openUserDetails(u); $event.preventDefault()">
        <div class="user-cell">
          <div class="avatar">{{ getUserInitial(u) }}</div>
          <span class="u-name">{{ getUserDisplayName(u) }}</span>
        </div>
        <span class="u-email">{{ u.email || '-' }}</span>
        <span><span class="status-chip" [ngClass]="u.isActive ? 'active' : 'suspended'">{{ u.isActive ? 'Active' : 'Inactive' }}</span></span>
        <span class="u-date">{{ u.createdAt | date:'mediumDate' }}</span>
        <span class="row-arrow"><mat-icon>chevron_right</mat-icon></span>
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
    .table-header { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 32px; gap: 16px; padding: 14px 20px; background: var(--color-surface-2); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
    .table-row { display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 32px; gap: 16px; padding: 16px 20px; align-items: center; border-top: 1px solid var(--color-border); transition: background var(--transition); }
    .table-row:hover { background: var(--color-surface-2); }
    .clickable-row { cursor: pointer; }
    .clickable-row:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-dim); color: var(--color-primary); font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .u-name { font-weight: 600; font-size: 14px; }
    .u-email { font-size: 13px; color: var(--color-text-muted); }
    .u-date { font-size: 12px; color: var(--color-text-muted); font-family: var(--font-mono); }
    .row-arrow { display: flex; align-items: center; justify-content: flex-end; color: var(--color-text-dim); }
    .row-arrow mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .table-row:hover .row-arrow { color: var(--color-primary); }
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
  openUserDetails(user: User): void {
    const ref = this.dialog.open(AssignTestDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { user, tests: [], mode: 'assign', userAssignments: [] }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('User assignments updated', 'OK');
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
}
