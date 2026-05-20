import { Routes } from '@angular/router';

export const DOCENTE_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'mis-cursos',
    loadComponent: () => import('./mis-cursos/mis-cursos.component').then(m => m.MisCursosComponent)
  },
  {
    path: 'materias/:id/importar-alumnos',
    loadComponent: () => import('./importar-alumnos/importar-alumnos.component').then(m => m.ImportarAlumnosComponent)
  },
  {
    path: 'materias/:id/alumnos',
    loadComponent: () => import('./importar-alumnos/importar-alumnos.component').then(m => m.ImportarAlumnosComponent)
  },
  {
    path: 'materias/:id/calificar',
    loadComponent: () => import('./registro-calificaciones/registro-calificaciones.component').then(m => m.RegistroCalificacionesComponent)
  },
  {
    path: 'materias/:id/cierre',
    loadComponent: () => import('./cierre-materia/cierre-materia.component').then(m => m.CierreMateriaComponent)
  },
  {
    path: 'historial-asistencias',
    loadComponent: () => import('./historial-asistencias/historial-asistencias.component').then(m => m.HistorialAsistenciasComponent)
  },
  {
    path: 'pase-lista',
    loadComponent: () => import('./pase-lista/pase-lista.component').then(m => m.PaseListaComponent)
  },
  {
    path: 'materias/:id/ponderaciones',
    loadComponent: () => import('./ponderaciones/ponderaciones.component').then(m => m.PonderacionesComponent)
  },
  {
    path: 'materias/:id/actividades',
    loadComponent: () => import('./actividades/actividades.component').then(m => m.ActividadesComponent)
  },
  {
    path: 'materias/:id/reportes',
    loadComponent: () => import('./reportes/reportes.component').then(m => m.ReportesComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

