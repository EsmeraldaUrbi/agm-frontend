import { environment } from '../../../environments/environment';

// Cuando se usa el API Gateway, el set-env.js ya construyó
// las URLs con el prefijo correcto (ej: https://gateway.com/api/auth).
// En local, cada URL apunta al puerto del microservicio correspondiente.
export const API_CONFIG = {
  auth: environment.msAuthUrl,                      // → /api/auth  (gateway) | :8001 (local)
  catalogos: environment.msCatalogosUrl,            // → /api/periodos        | :8002/api/v1 (local)
  usuarios: environment.msUsuariosUrl,              // → /api/alumnos         | :8003 (local)
  calificaciones: environment.msCalificacionesUrl,  // → /api/calificaciones  | :8004/api/v1 (local)
  asistencias: environment.msAsistenciasUrl,        // → /api/asistencias     | :8005 (local)
  notificaciones: environment.msNotificacionesUrl,  // → /api/notificaciones  | :8006 (local)
  reportes: environment.msReportesUrl,              // → /api/reportes        | :8007 (local)
};
