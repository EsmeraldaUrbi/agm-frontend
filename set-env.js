const fs = require('fs');

const targetPath = './src/environments/environment.ts';

// Una sola variable apunta al API Gateway (Railway u otro).
// En local, si no hay gateway, cada MS usa su puerto por separado.
const rawGateway = (process.env.API_GATEWAY_URL || '').trim().replace(/\/+$/, '');
const gateway = rawGateway
  .replace(/^http:\/\/(?!localhost|127\.0\.0\.1)/, 'https://')
  .replace(/\/api$/, '');
const apiBase = gateway ? `${gateway}/api` : '';

const msAuthUrl        = gateway ? apiBase                   : 'http://localhost:8001';
const msCatalogosUrl   = gateway ? `${apiBase}/v1`           : 'http://localhost:8002/api/v1';
const msUsuariosUrl    = gateway ? `${apiBase}/alumnos`      : 'http://localhost:8003/api/v1';
const msCalificacionesUrl = gateway ? `${apiBase}/calificaciones` : 'http://localhost:8004/api/v1';
const msAsistenciasUrl = gateway ? `${apiBase}/asistencias`  : 'http://localhost:8005';
const msNotificacionesUrl = gateway ? `${apiBase}/notificaciones` : 'http://localhost:8006/api/v1/notificaciones';
const msReportesUrl    = gateway ? `${apiBase}/reportes`     : 'http://localhost:8007/api/v1';

const envConfigFile = `export const environment = {
  production: ${gateway ? 'true' : 'false'},
  msAuthUrl: '${msAuthUrl}',
  msCatalogosUrl: '${msCatalogosUrl}',
  msUsuariosUrl: '${msUsuariosUrl}',
  msCalificacionesUrl: '${msCalificacionesUrl}',
  msAsistenciasUrl: '${msAsistenciasUrl}',
  msNotificacionesUrl: '${msNotificacionesUrl}',
  msReportesUrl: '${msReportesUrl}'
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error('Error escribiendo environment.ts', err);
    process.exit(1);
  }
  console.log(`Variables de entorno generadas en ${targetPath}`);
  console.log('Gateway URL:', gateway || '(local - usando localhost)');
});
