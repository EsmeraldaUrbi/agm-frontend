import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios/usuarios').then(m => m.UsuariosComponent)
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
