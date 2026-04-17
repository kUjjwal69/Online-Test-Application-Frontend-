import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ShellComponent, NavItem } from '../../../shared/components/shell/shell.component';

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
  { label: 'Tests', icon: 'quiz', route: '/admin/tests' },
  { label: 'Users', icon: 'group', route: '/admin/users' },
  { label: 'Sessions', icon: 'assignment', route: '/admin/sessions' },
  { label: 'Violations', icon: 'gpp_bad', route: '/admin/violations' },
];

const TITLE_MAP: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/tests': 'Manage Tests',
  '/admin/users': 'Manage Users',
  '/admin/profile': 'My Profile',
  '/admin/sessions': 'Test Sessions',
  '/admin/violations': 'Violations',
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, ShellComponent, AsyncPipe],
  template: `
    <app-shell [navItems]="navItems" [pageTitle]="currentTitle">
      <router-outlet></router-outlet>
    </app-shell>
  `
})
export class AdminLayoutComponent {
  navItems = ADMIN_NAV;
  currentTitle = 'Dashboard';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: any) => {
        const base = '/' + e.urlAfterRedirects.split('/').slice(1, 3).join('/');
        return TITLE_MAP[base] || 'Admin';
      })
    ).subscribe(title => this.currentTitle = title);
  }
}
