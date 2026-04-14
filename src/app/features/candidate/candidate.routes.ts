import { Routes } from '@angular/router';

export const candidateRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./candidate-layout/candidate-layout.component').then(m => m.CandidateLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/candidate-dashboard.component').then(m => m.CandidateDashboardComponent) },
      { path: 'tests', loadComponent: () => import('./test-list/test-list.component').then(m => m.TestListComponent) },
      { path: 'results', loadComponent: () => import('./result/results.component').then(m => m.ResultsComponent) },
      { path: 'results/:sessionId', loadComponent: () => import('./result/results.component').then(m => m.ResultsComponent) },
    ]
  }
];
