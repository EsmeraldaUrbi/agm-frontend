import { Routes } from '@angular/router';

export const ALUMNO_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'materias',
    loadComponent: () => import('./mis-materias/mis-materias.component').then(m => m.MisMateriasComponent)
  },
  {
    path: 'horario',
    loadComponent: () => import('../../shared/components/horario/horario.component').then(m => m.HorarioComponent)
  },
  {
    path: 'qr',
    loadComponent: () => import('./qr-asistencia/qr-asistencia.component').then(m => m.QrAsistenciaComponent)
  },
  {
    path: 'calificaciones/:materiaId',
    loadComponent: () => import('./calificaciones/calificaciones.component').then(m => m.CalificacionesComponent)
  },
  {
    path: 'notificaciones',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'reportes',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
