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
    path: 'importar-materias',
    loadComponent: () => import('./importar-materias/importar-materias.component').then(m => m.ImportarMateriasComponent)
  },
  {
    path: 'materias/:id/calificaciones',
    loadComponent: () => import('./registro-calificaciones/registro-calificaciones.component').then(m => m.RegistroCalificacionesComponent)
  },
  {
    path: 'materias/:id/cierre',
    loadComponent: () => import('./cierre-materia/cierre-materia.component').then(m => m.CierreMateriaComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

