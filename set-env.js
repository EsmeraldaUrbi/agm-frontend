const fs = require('fs');

const targetPath = './src/environments/environment.ts';

// Una sola variable apunta al API Gateway (Railway u otro).
// En local, si no hay gateway, cada MS usa su puerto por separado.
const gateway = process.env.API_GATEWAY_URL || '';

const msAuthUrl        = gateway ? `${gateway}/api/auth`          : 'http://localhost:8001';
const msCatalogosUrl   = gateway ? `${gateway}/api/periodos`      : 'http://localhost:8002';
const msUsuariosUrl    = gateway ? `${gateway}/api/alumnos`       : 'http://localhost:8003';
const msCalificacionesUrl = gateway ? `${gateway}/api/calificaciones` : 'http://localhost:8004/api/v1';
const msAsistenciasUrl = gateway ? `${gateway}/api/asistencias`   : 'http://localhost:8005';
const msNotificacionesUrl = gateway ? `${gateway}/api/notificaciones` : 'http://localhost:8006';
const msReportesUrl    = gateway ? `${gateway}/api/reportes`      : 'http://localhost:8007';

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
