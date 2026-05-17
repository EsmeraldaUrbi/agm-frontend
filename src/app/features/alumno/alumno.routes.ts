import { Routes } from '@angular/router';

export const ALUMNO_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('../../shared/components/placeholder-dashboard/placeholder-dashboard').then(m => m.PlaceholderDashboardComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
