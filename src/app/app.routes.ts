import { Routes } from '@angular/router';
import { authGuard, adminGuard, candidateGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // ─── Auth Routes ────────────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // ─── Admin Routes ───────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },

  // ─── Candidate Routes ───────────────────────────────────────────────
  {
    path: 'candidate',
    canActivate: [candidateGuard],
    loadChildren: () => import('./features/candidate/candidate.routes').then(m => m.candidateRoutes)
  },

  // ─── Exam Session (no sidebar) ──────────────────────────────────────
  {
    path: 'exam',
    canActivate: [authGuard],
    loadChildren: () => import('./features/proctoring/proctoring.routes').then(m => m.proctoringRoutes)
  },

  { path: '**', redirectTo: '/auth/login' }
];
