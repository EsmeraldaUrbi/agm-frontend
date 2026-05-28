const fs = require('fs');

const targetPath = './src/environments/environment.ts';

// Estas son las variables de entorno que vas a configurar en Render.
// Si no existen (por ejemplo cuando corres en local), usará localhost por defecto.
const envConfigFile = `export const environment = {
  production: true,
  msAuthUrl: '${process.env.MS_AUTH_URL || 'http://localhost:8001'}',
  msCatalogosUrl: '${process.env.MS_CATALOGOS_URL || 'http://localhost:8002'}',
  msUsuariosUrl: '${process.env.MS_USUARIOS_URL || 'http://localhost:8003'}',
  msCalificacionesUrl: '${process.env.MS_CALIFICACIONES_URL || 'http://localhost:8004/api/v1'}',
  msAsistenciasUrl: '${process.env.MS_ASISTENCIAS_URL || 'http://localhost:8005'}',
  msNotificacionesUrl: '${process.env.MS_NOTIFICACIONES_URL || 'http://localhost:8006'}',
  msReportesUrl: '${process.env.MS_REPORTES_URL || 'http://localhost:8007'}'
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error('Error escribiendo environment.ts', err);
    process.exit(1);
  }
  console.log(`Variables de entorno generadas en ${targetPath}`);
});
