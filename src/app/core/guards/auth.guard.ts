import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthenticated = auth.isAuthenticated();
  console.log('[authGuard]', { isAuthenticated, role: auth.getRole(), url: router.url });
  if (isAuthenticated) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthenticated = auth.isAuthenticated();
  const isAdmin = auth.isAdmin();
  console.log('[adminGuard]', { isAuthenticated, isAdmin, role: auth.getRole(), url: router.url });
  if (isAuthenticated && isAdmin) return true;
  if (!isAuthenticated) router.navigate(['/auth/login']);
  else router.navigate(['/candidate/dashboard']);
  return false;
};

export const candidateGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthenticated = auth.isAuthenticated();
  const isCandidate = auth.isCandidate();
  console.log('[candidateGuard]', { isAuthenticated, isCandidate, role: auth.getRole(), url: router.url });
  if (isAuthenticated && isCandidate) return true;
  if (!isAuthenticated) router.navigate(['/auth/login']);
  else router.navigate(['/admin/dashboard']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthenticated = auth.isAuthenticated();
  const isAdmin = auth.isAdmin();
  console.log('[guestGuard]', { isAuthenticated, isAdmin, role: auth.getRole(), url: router.url });
  if (!isAuthenticated) return true;
  if (isAdmin) router.navigate(['/admin/dashboard']);
  else router.navigate(['/candidate/dashboard']);
  return false;
};
