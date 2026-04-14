import { Routes } from '@angular/router';

export const proctoringRoutes: Routes = [
  {
    path: 'session',
    loadComponent: () =>
      import('./exam-session/exam-session.component').then(m => m.ExamSessionComponent)
  },
  {
    path: 'result',
    loadComponent: () =>
      import('./exam-result/exam-result.component').then(m => m.ExamResultComponent)
  }
];
