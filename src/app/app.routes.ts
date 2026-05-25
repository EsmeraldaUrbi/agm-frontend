import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout';
import { LoginComponent } from './features/auth/login/login';
import { LandingComponent } from './features/landing/landing';
import { authGuard } from './core/guards/auth.guard';

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
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'docente',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['docente'] },
    loadChildren: () => import('./features/docente/docente.routes').then(m => m.DOCENTE_ROUTES)
  },
  {
    path: 'alumno',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['alumno'] },
    loadChildren: () => import('./features/alumno/alumno.routes').then(m => m.ALUMNO_ROUTES)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent)
      }
    ]
  },
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./features/errors/acceso-denegado/acceso-denegado').then(m => m.AccesoDenegadoComponent)
  },
  {
    path: 'sesion-expirada',
    loadComponent: () => import('./features/errors/sesion-expirada/sesion-expirada').then(m => m.SesionExpiradaComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/errors/error-404/error-404').then(m => m.Error404Component)
  }
];
