import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  template: `
    <div class="shell" [class.collapsed]="sidebarCollapsed">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <span class="brand-icon">⬡</span>
            <span class="brand-name" *ngIf="!sidebarCollapsed">ExamPro</span>
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed"
            [matTooltip]="sidebarCollapsed ? 'Expand' : 'Collapse'">
            <mat-icon>{{ sidebarCollapsed ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <div class="sidebar-role-badge" *ngIf="!sidebarCollapsed">
          <span class="role-dot" [class.admin]="isAdmin"></span>
          {{ isAdmin ? 'Admin Panel' : 'Candidate Panel' }}
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item"
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="active"
            [matTooltip]="sidebarCollapsed ? item.label : ''"
            matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
            <span class="nav-badge" *ngIf="item.badge && !sidebarCollapsed">{{ item.badge }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="!sidebarCollapsed">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-details">
              <div class="user-name">{{ userName }}</div>
              <div class="user-username">{{ userUsername }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()" [matTooltip]="sidebarCollapsed ? 'Logout' : ''" matTooltipPosition="right">
            <mat-icon>logout</mat-icon>
            <span *ngIf="!sidebarCollapsed">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="topbar">
          <h2 class="page-title">{{ pageTitle }}</h2>
          <div class="topbar-right">
            <div class="topbar-user">
              <div class="user-avatar sm">{{ userInitial }}</div>
              <span *ngIf="userName">{{ userName }}</span>
            </div>
          </div>
        </div>
        <div class="content-area">
          <ng-content></ng-content>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
      transition: grid-template-columns 0.3s ease;
    }
    .shell.collapsed { grid-template-columns: 70px 1fr; }

    /* Sidebar */
    .sidebar {
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex; flex-direction: column;
      position: sticky; top: 0; height: 100vh;
      overflow: hidden;
    }

    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 16px; border-bottom: 1px solid var(--color-border);
    }
    .brand { display: flex; align-items: center; gap: 10px; overflow: hidden; }
    .brand-icon { font-size: 24px; flex-shrink: 0; filter: drop-shadow(0 0 8px rgba(79,142,247,0.5)); }
    .brand-name { font-size: 18px; font-weight: 700; font-family: var(--font-mono); white-space: nowrap; background: linear-gradient(135deg, #4f8ef7, #a0c4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .collapse-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 4px; display: flex; align-items: center; transition: color var(--transition); }
    .collapse-btn:hover { color: var(--color-text); }

    .sidebar-role-badge {
      margin: 12px 16px;
      padding: 6px 12px;
      background: var(--color-primary-dim);
      border: 1px solid rgba(79,142,247,0.2);
      border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
      color: var(--color-primary);
      display: flex; align-items: center; gap: 8px;
    }
    .role-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-text-muted); }
    .role-dot.admin { background: var(--color-warning); }

    .sidebar-nav {
      flex: 1; padding: 12px 10px;
      display: flex; flex-direction: column; gap: 2px;
      overflow-y: auto;
    }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: var(--radius-sm);
      color: var(--color-text-muted); text-decoration: none;
      transition: all var(--transition); position: relative;
      white-space: nowrap;
    }
    .nav-item:hover { background: var(--color-surface-2); color: var(--color-text); }
    .nav-item.active { background: var(--color-primary-dim); color: var(--color-primary); }
    .nav-item.active .nav-icon { color: var(--color-primary); }
    .nav-icon { font-size: 20px !important; width: 20px; height: 20px; flex-shrink: 0; }
    .nav-label { font-size: 14px; font-weight: 500; }
    .nav-badge { margin-left: auto; background: var(--color-primary); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }

    .sidebar-footer {
      border-top: 1px solid var(--color-border);
      padding: 16px 10px 12px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .user-info { display: flex; align-items: center; gap: 10px; padding: 0 6px; overflow: hidden; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-dim); border: 2px solid rgba(79,142,247,0.3); color: var(--color-primary); font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-avatar.sm { width: 28px; height: 28px; font-size: 12px; }
    .user-details { overflow: hidden; }
    .user-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-username { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; background: none; border: none; cursor: pointer; color: var(--color-text-muted); border-radius: var(--radius-sm); font-family: var(--font-main); font-size: 14px; font-weight: 500; transition: all var(--transition); }
    .logout-btn:hover { background: rgba(247,95,79,0.1); color: var(--color-danger); }

    /* Main */
    .main-content { display: flex; flex-direction: column; min-height: 100vh; overflow: hidden; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); position: sticky; top: 0; z-index: 10; }
    .page-title { font-size: 18px; font-weight: 700; }
    .topbar-right { display: flex; align-items: center; gap: 16px; }
    .topbar-user { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--color-text-muted); }
    .content-area { padding: 32px; flex: 1; }
  `]
})
export class ShellComponent {
  @Input() navItems: NavItem[] = [];
  @Input() pageTitle = '';

  sidebarCollapsed = false;

  get isAdmin(): boolean { return this.auth.isAdmin(); }
  get userName(): string { return this.auth.getCurrentUser()?.fullName || ''; }
  get userUsername(): string { return this.auth.getCurrentUser()?.username || ''; }
  get userInitial(): string { return this.userName.charAt(0).toUpperCase() || 'U'; }

  constructor(private auth: AuthService, private router: Router) {}

  logout(): void { this.auth.logout(); }
}
