import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { GalleryComponent } from './gallery/gallery.component';
import { HorarioComponent } from './horario/horario.component';
import { QrAsistenciaComponent } from './qr-asistencia/qr-asistencia.component';

export const ALUMNO_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'estados-vacios',
    component: GalleryComponent
  },
  {
    path: 'horario',
    component: HorarioComponent
  },
  {
    path: 'qr',
    component: QrAsistenciaComponent
  }
];
