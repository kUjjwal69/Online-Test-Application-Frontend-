import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'tests', loadComponent: () => import('./tests/tests.component').then(m => m.TestsComponent) },
      { path: 'tests/:id/questions', loadComponent: () => import('./questions/questions.component').then(m => m.QuestionsComponent) },
      { path: 'users', loadComponent: () => import('./users/users.component').then(m => m.UsersComponent) },
      { path: 'profile', loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'sessions', loadComponent: () => import('./sessions/sessions.component').then(m => m.SessionsComponent) },
      { path: 'sessions/:id', loadComponent: () => import('./sessions/session-detail.component').then(m => m.SessionDetailComponent) },
      { path: 'violations', loadComponent: () => import('./violations/violations.component').then(m => m.ViolationsComponent) },
    ]
  }
];
