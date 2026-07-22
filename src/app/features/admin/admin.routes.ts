import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'periodos',
    loadComponent: () => import('./periodos/periodos.component').then(m => m.PeriodosComponent)
  },
  {
    path: 'importar-materias',
    loadComponent: () => import('./importar-materias/importar-materias.component').then(m => m.ImportarMateriasComponent)
  },
  {
    path: 'importar-docentes',
    loadComponent: () => import('./importar-docentes/importar-docentes.component').then(m => m.ImportarDocentesComponent)
  },
  {
    path: 'materias',
    loadComponent: () => import('./materias/materias.component').then(m => m.MateriasComponent)
  },
  {
    path: 'planes-estudio',
    loadComponent: () => import('./planes-estudio/planes-estudio.component').then(m => m.PlanesEstudioComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
