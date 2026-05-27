const fs = require('fs');
let c = fs.readFileSync('src/app/features/docente/registro-calificaciones/registro-calificaciones.component.html', 'utf8');

c = c.replace(/SecciÃ³n/g, 'Sección');
c = c.replace(/NavegaciÃ³n/g, 'Navegación');
c = c.replace(/TÃ\xadtulo/g, 'Título'); // Title with soft hyphen
c = c.replace(/MATRÃ CULA/g, 'MATRÍCULA');
c = c.replace(/MATRÃ\xadCULA/g, 'MATRÍCULA');
c = c.replace(/CALIFICACIÃ“N/g, 'CALIFICACIÓN');
c = c.replace(/CalificaciÃ³n/g, 'Calificación');
c = c.replace(/SincronizaciÃ³n/g, 'Sincronización');
c = c.replace(/vÃ\xada/g, 'vía'); // via with soft hyphen
c = c.replace(/SelecciÃ³n/g, 'Selección');
c = c.replace(/aquÃ\xad/g, 'aquí'); // aqui with soft hyphen
c = c.replace(/calificaciÃ³n/g, 'calificación');
c = c.replace(/ImportaciÃ³n/g, 'Importación');
c = c.replace(/Ã‰xito/g, 'Éxito');
c = c.replace(/MatrÃ\xadcula/g, 'Matrícula'); // Matricula with soft hyphen
c = c.replace(/TardÃ\xada/g, 'Tardía'); // Tardia with soft hyphen
c = c.replace(/EntregÃ³/g, 'Entregó');
c = c.replace(/RetroalimentaciÃ³n/g, 'Retroalimentación');
c = c.replace(/desempeÃ±o/g, 'desempeño');

// Fallback regex to catch standard Ã³ Ã± etc
c = c.replace(/Ã³/g, 'ó');
c = c.replace(/Ã±/g, 'ñ');
c = c.replace(/Ã“/g, 'Ó');
c = c.replace(/Ã‰/g, 'É');

// Finally, sometimes there's an `Ã` followed by a space, which is an `í`. Or `Ã\xad`
c = c.replace(/Ã /g, 'í');
c = c.replace(/Ã\xad/g, 'í');

fs.writeFileSync('src/app/features/docente/registro-calificaciones/registro-calificaciones.component.html', c, 'utf8');
console.log('Fixed encoding with Regex');
