const gatewayUrl = 'https://api-gateway-production-0647.up.railway.app/api';

export const environment = {
  production: true,
  msAuthUrl: `${gatewayUrl}/auth`,
  msCatalogosUrl: `${gatewayUrl}/periodos`,
  msUsuariosUrl: `${gatewayUrl}/alumnos`,
  msCalificacionesUrl: `${gatewayUrl}/calificaciones`,
  msAsistenciasUrl: `${gatewayUrl}/asistencias`,
  msNotificacionesUrl: `${gatewayUrl}/notificaciones`,
  msReportesUrl: `${gatewayUrl}/reportes`
};
