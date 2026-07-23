import { Routes } from '@angular/router';

export const ALUMNO_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'estados-vacios',
    loadComponent: () => import('./gallery/gallery.component').then(m => m.GalleryComponent)
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
    loadComponent: () => import('./notificaciones/notificaciones.component').then(m => m.NotificacionesComponent)
  },
  {
    path: 'reportes',
    loadComponent: () => import('./reportes/reportes.component').then(m => m.ReportesComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
