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
    loadComponent: () => import('./periodos/periodos').then(m => m.PeriodosComponent)
  },
  {
    path: 'importar-materias',
    loadComponent: () => import('../docente/importar-materias/importar-materias.component').then(m => m.ImportarMateriasComponent)
  },
  {
    path: 'importar-docentes',
    loadComponent: () => import('./importar-docentes/importar-docentes').then(m => m.ImportarDocentesComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
