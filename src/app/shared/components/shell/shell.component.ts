import { Component, Input, OnInit } from '@angular/core';
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
    <div class="shell" [class.collapsed]="sidebarCollapsed" [class.drawer-closed]="!drawerOpen">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand" (click)="goToDashboard()" style="cursor: pointer;">
            <span class="brand-icon">⬡</span>
            <span class="brand-name" *ngIf="!sidebarCollapsed" (click)="goToDashboard()">ExamPro</span>
          </div>
          <button class="collapse-btn" (click)="toggleDrawer()"
            [matTooltip]="drawerOpen ? 'Close Drawer' : 'Open Drawer'">
            <mat-icon>{{ drawerOpen ? 'chevron_left' : 'chevron_right' }}</mat-icon>
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
            (click)="navigateToItem(item, $event)"
            routerLinkActive="active"
            [matTooltip]="sidebarCollapsed ? item.label : ''"
            matTooltipPosition="right">
            <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
            <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
            <span class="nav-badge" *ngIf="item.badge && !sidebarCollapsed">{{ item.badge }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button
            class="theme-btn"
            (click)="toggleTheme()"
            [matTooltip]="sidebarCollapsed ? themeLabel : ''"
            matTooltipPosition="right">
            <mat-icon>{{ themeIcon }}</mat-icon>
            <span *ngIf="!sidebarCollapsed">{{ themeLabel }}</span>
          </button>
          <button class="logout-btn" (click)="logout()" [disabled]="isLoggingOut" [matTooltip]="sidebarCollapsed ? 'Logout' : ''" matTooltipPosition="right">
            <mat-icon>{{ isLoggingOut ? 'autorenew' : 'logout' }}</mat-icon>
            <span *ngIf="!sidebarCollapsed">{{ isLoggingOut ? 'Signing out...' : 'Logout' }}</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="topbar">
          <div class="topbar-left">
            <button class="menu-btn" (click)="toggleDrawer()" matTooltip="Toggle drawer">
              <mat-icon>{{ drawerOpen ? 'menu_open' : 'menu' }}</mat-icon>
            </button>
            <h2 class="page-title" (click)="goToDashboard()">{{ pageTitle }}</h2>
          </div>
        <div class="topbar-right">
            <span class="user-name" *ngIf="userLabel">{{ userLabel }}</span>
            <button class="profile-icon-btn" (click)="openProfile()" matTooltip="Profile">
              <mat-icon>person</mat-icon>
            </button>
          </div>
        </div>
        <div class="content-area">
          <ng-content></ng-content>
        </div>
      </main>

      <div class="logout-overlay" *ngIf="isLoggingOut">
        <div class="logout-message">
          <mat-icon>logout</mat-icon>
          <span>Signing you out...</span>
        </div>
      </div>
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
    .shell.drawer-closed { grid-template-columns: 0 1fr; }

    /* Sidebar */
    .sidebar {
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex; flex-direction: column;
      position: sticky; top: 0; height: 100vh;
      overflow: hidden;
      transition: transform 0.25s ease, opacity 0.25s ease;
    }
    .shell.drawer-closed .sidebar { transform: translateX(-100%); opacity: 0; pointer-events: none; border-right: none; }

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
    .theme-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; background: none; border: none; cursor: pointer; color: var(--color-text-muted); border-radius: var(--radius-sm); font-family: var(--font-main); font-size: 14px; font-weight: 500; transition: all var(--transition); }
    .theme-btn:hover { background: var(--color-surface-2); color: var(--color-primary); }
    .logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; background: none; border: none; cursor: pointer; color: var(--color-text-muted); border-radius: var(--radius-sm); font-family: var(--font-main); font-size: 14px; font-weight: 500; transition: all var(--transition); }
    .logout-btn:hover { background: rgba(247,95,79,0.1); color: var(--color-danger); }
    .logout-btn:disabled { opacity: 0.8; cursor: default; }
    .logout-btn:disabled mat-icon { animation: spin 0.9s linear infinite; }

    /* Main */
    .main-content { display: flex; flex-direction: column; min-height: 100vh; overflow: hidden; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); position: sticky; top: 0; z-index: 10; }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .menu-btn { background: none; border: 1px solid var(--color-border); color: var(--color-text-muted); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
    .menu-btn:hover { color: var(--color-text); border-color: var(--color-primary); }
    .page-title { font-size: 18px; font-weight: 800; }
    .topbar-right { display: flex; align-items: center; gap: 16px; }
    .user-name { font-size: 13px; font-weight: 600; color: var(--color-text-muted); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .profile-icon-btn { width: 34px; height: 34px; border: none; background: none; color: var(--color-text-muted); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
    .profile-icon-btn:hover { color: var(--color-primary); background: var(--color-primary-dim); }
    .content-area { padding: 32px; flex: 1; }
    .logout-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 13, 20, 0.35);
      backdrop-filter: blur(1.5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.25s ease;
    }
    .logout-message {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      font-weight: 600;
      box-shadow: var(--shadow);
    }
    .logout-message mat-icon { animation: spin 0.9s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ShellComponent implements OnInit {
  @Input() navItems: NavItem[] = [];
  @Input() pageTitle = '';

  readonly THEME_KEY = 'exam_theme';
  sidebarCollapsed = false;
  drawerOpen = true;
  isLoggingOut = false;
  theme: 'dark' | 'light' = 'dark';

  get isAdmin(): boolean { return this.auth.isAdmin(); }
  get userName(): string { return this.auth.getCurrentUser()?.fullName || ''; }
  get userUsername(): string { return this.auth.getCurrentUser()?.username || ''; }
  get userLabel(): string { return this.userName || this.userUsername || 'Candidate'; }
  get userInitial(): string { return this.userLabel.charAt(0).toUpperCase() || 'U'; }

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    this.theme = savedTheme === 'light' ? 'light' : 'dark';
    this.applyTheme();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(this.THEME_KEY, this.theme);
    this.applyTheme();
  }

  get themeLabel(): string {
    return this.theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  get themeIcon(): string {
    return this.theme === 'dark' ? 'light_mode' : 'dark_mode';
  }

  toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
  }

  openProfile(): void {
    const profileRoute = this.isAdmin ? '/admin/profile' : '/candidate/profile';
    this.router.navigate([profileRoute]);
  }
  goToDashboard(): void {
  const route = this.isAdmin ? '/admin/dashboard' : '/candidate/dashboard';
  this.router.navigate([route]);
}

  navigateToItem(item: NavItem, event: MouseEvent): void {
    if (item.route !== '/candidate/results') return;

    event.preventDefault();
    this.router.navigate([item.route], { queryParams: { refresh: Date.now() } });
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  logout(): void {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;
    window.setTimeout(() => {
      this.auth.logout();
      this.isLoggingOut = false;
    }, 700);
  }
}
