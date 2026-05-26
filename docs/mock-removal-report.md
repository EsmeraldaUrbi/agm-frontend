# Reporte de Eliminación de Mocks y Datos Hardcodeados - Proyecto AGM

Este reporte detalla todas las acciones tomadas para eliminar datos simulados, mocks locales y simulaciones de latencia del frontend, garantizando una conexión 100% directa y real con los microservicios en el backend.

---

## 1. Mocks y Datos Locales Eliminados

A lo largo del proceso de integración, se detectaron y removieron exitosamente las siguientes simulaciones de datos locales:

### A. Autenticación y Recuperación de Contraseña (`auth.service.ts` / `login.ts`)
- **Eliminado:** El token mock temporal `"mock"` utilizado en el método `resetPassword`.
- **Eliminado:** Lógica de bypass local en la pantalla de inicio de sesión que redirigía por rol sin comprobar la respuesta física del backend.
- **Reemplazado por:** Envío de payload correcto `{email, contrasena}` a `/auth/login`, persistiendo la sesión real (access_token, refresh_token y claims de usuario en localStorage) y protegiendo las rutas con `authGuard`.

### B. Gestión de Docentes del Administrador (`usuarios.ts`)
- **Eliminado:** El arreglo local en la señal `usersList()` que se manipulaba de forma estática para simular altas, ediciones y bajas sin persistencia de red.
- **Eliminado:** Uso de `Math.random().toString(36)` para generar IDs de docentes falsos en el cliente.
- **Reemplazado por:** Peticiones HTTP reales (GET `/api/v1/docentes` y PATCH `/api/v1/docentes/:id`) administradas por `DocentesService` para persistir la edición e inhabilitación de docentes.

### C. Mis Cursos del Docente (`mis-cursos.component.ts`)
- **Eliminado:** El array estático vacío `cursos = []` sin ninguna carga de datos de servicio.
- **Reemplazado por:** Flujo real de resolución de `docente_id` basado en el correo del usuario autenticado, seguido de la consulta real a MS-2 (`/materias/docente/:docente_id`) y flujo de cancelación real (PATCH `/materias-ofertadas/:materia_ofertada_id/cancelar`).

### D. Dashboard e Indicadores del Alumno (`dashboard.component.ts`)
- **Eliminado:** Objetos estáticos vacíos en `estadisticasMaterias` y `alumnoInfo`.
- **Reemplazado por:** Cargas secuenciales mediante `forkJoin` y `AlumnosService.getAlumnos` (resolución de ID), `ReportesService.getEstadisticasAlumno` (MS-7), e `InscripcionesService` (MS-3). Las calificaciones y promedios por materia se calculan dinámicamente llamando a `CalificacionesService.getCalificacionesAlumnoMateria` (MS-4) en lugar de simular notas fijas.

---

## 2. Documentación de Endpoints Faltantes en el Backend Real

Durante la auditoría técnica profunda, se detectaron acciones en la UI del frontend que no cuentan con un endpoint real equivalente en el backend. Estos se manejaron documentando los contratos correspondientes sin forzar simulaciones de red o fallback funcionales ficticios:

### A. Registro Individual de Docente
- **Pantalla afectada:** Modal de creación de docente en `features/admin/usuarios` (`saveUser()`).
- **Endpoint faltante:** `POST /api/v1/docentes`
- **Acción tomada:** Se bloqueó la creación individual manual en la UI, mostrando una advertencia de que la creación individual está inhabilitada y el administrador debe recurrir a la **Importación Masiva (Excel)** de docentes soportada por `POST /api/v1/importar/docentes` en MS-3.

### B. Baja de Materia por el Alumno
- **Pantalla afectada:** Solicitud de baja en `features/alumno/solicitar-baja`.
- **Endpoint faltante:** `DELETE /api/v1/inscripciones/:id` (o equivalente en MS-3).
- **Acción tomada:** Se documentó que la baja de materias requiere del desarrollo de este endpoint. La acción permanece inactiva en producción, informando al estudiante que debe realizar el trámite presencial en ventanilla de servicios escolares.

---

## 3. Estado de la Búsqueda Global de Mocks

Se realizó una búsqueda global en el workspace del frontend para asegurar que no existan dependencias funcionales o imports rotos de archivos de prueba:

- [x] Sin directivas de latencia ficticias (`setTimeout` de red).
- [x] Sin variables con prefijo `mockData` o `dummyData` en servicios principales.
- [x] Compilación y empaquetado del frontend limpio y exitoso.
