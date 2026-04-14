import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { ShellComponent, NavItem } from '../../../shared/components/shell/shell.component';

const CANDIDATE_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/candidate/dashboard' },
  { label: 'My Tests', icon: 'assignment', route: '/candidate/tests' },
  { label: 'Results', icon: 'leaderboard', route: '/candidate/results' },
];

const TITLE_MAP: Record<string, string> = {
  '/candidate/dashboard': 'Dashboard',
  '/candidate/tests': 'My Tests',
  '/candidate/results': 'My Results',
};

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [RouterOutlet, ShellComponent],
  template: `
    <app-shell [navItems]="navItems" [pageTitle]="currentTitle">
      <router-outlet></router-outlet>
    </app-shell>
  `
})
export class CandidateLayoutComponent {
  navItems = CANDIDATE_NAV;
  currentTitle = 'Dashboard';
  constructor(private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map((e: any) => {
      const base = '/' + e.urlAfterRedirects.split('/').slice(1, 3).join('/');
      return TITLE_MAP[base] || 'Candidate';
    })).subscribe(t => this.currentTitle = t);
  }
}
