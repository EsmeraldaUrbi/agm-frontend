import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { GalleryComponent } from './gallery/gallery.component';
import { HorarioComponent } from './horario/horario.component';
import { QrAsistenciaComponent } from './qr-asistencia/qr-asistencia.component';
import { CalificacionesComponent } from './calificaciones/calificaciones.component';
import { SolicitarBajaComponent } from './solicitar-baja/solicitar-baja.component';
import { NotificacionesComponent } from './notificaciones/notificaciones.component';
import { ReportesComponent } from './reportes/reportes.component';
import { MisMateriasComponent } from './mis-materias/mis-materias.component';

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
    path: 'materias',
    component: MisMateriasComponent
  },
  {
    path: 'horario',
    component: HorarioComponent
  },
  {
    path: 'qr',
    component: QrAsistenciaComponent
  },
  {
    path: 'calificaciones',
    component: CalificacionesComponent
  },
  {
    path: 'notificaciones',
    component: NotificacionesComponent
  },
  {
    path: 'reportes',
    component: ReportesComponent
  }
];
