import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('../../shared/components/placeholder-dashboard/placeholder-dashboard').then(m => m.PlaceholderDashboardComponent)
  },
  {
    path: 'periodos',
    loadComponent: () => import('../../shared/components/placeholder-dashboard/placeholder-dashboard').then(m => m.PlaceholderDashboardComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
