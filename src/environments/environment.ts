const gatewayUrl = 'https://api-gateway-production-0647.up.railway.app';
const apiBase = `${gatewayUrl}/api`;

export const environment = {
  production: true,
  msAuthUrl: apiBase,
  msCatalogosUrl: `${apiBase}/v1`,
  msUsuariosUrl: `${apiBase}/alumnos`,
  msCalificacionesUrl: `${apiBase}/calificaciones`,
  msAsistenciasUrl: `${apiBase}/asistencias`,
  msNotificacionesUrl: `${apiBase}/notificaciones`,
  msReportesUrl: `${apiBase}/reportes`
};
