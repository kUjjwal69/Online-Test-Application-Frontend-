import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('exam_token');
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('exam_token');
        localStorage.removeItem('exam_user');
        router.navigate(['/auth/login']);
        snackBar.open('Session expired. Please login again.', 'Close', { duration: 3000 });
      } else if (error.status === 403) {
        snackBar.open('Access denied. Insufficient permissions.', 'Close', { duration: 3000 });
      } else if (error.status === 0) {
        snackBar.open('Cannot connect to server. Check your connection.', 'Close', { duration: 4000 });
      }
      return throwError(() => error);
    })
  );
};
