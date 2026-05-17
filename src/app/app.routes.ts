import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout';
import { LoginComponent } from './features/auth/login/login';
import { LandingComponent } from './features/landing/landing';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/recover-password/recover-password').then(m => m.RecoverPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'admin',
    component: MainLayoutComponent,
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'docente',
    component: MainLayoutComponent,
    loadChildren: () => import('./features/docente/docente.routes').then(m => m.DOCENTE_ROUTES)
  },
  {
    path: 'alumno',
    component: MainLayoutComponent,
    loadChildren: () => import('./features/alumno/alumno.routes').then(m => m.ALUMNO_ROUTES)
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./shared/components/placeholder-dashboard/placeholder-dashboard').then(m => m.PlaceholderDashboardComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
