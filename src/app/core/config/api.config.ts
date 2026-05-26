import { environment } from '../../../environments/environment';

export const API_CONFIG = {
  auth: environment.msAuthUrl,
  catalogos: environment.msCatalogosUrl, // MS-2
  usuarios: environment.msUsuariosUrl, // MS-3
  calificaciones: environment.msCalificacionesUrl, // MS-4
  asistencias: environment.msAsistenciasUrl, // MS-5
  notificaciones: environment.msNotificacionesUrl, // MS-6
  reportes: environment.msReportesUrl, // MS-7
};
