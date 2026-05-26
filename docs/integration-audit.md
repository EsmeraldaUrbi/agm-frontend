# Auditoría Inicial de Integración - Proyecto AGM

Este documento presenta una auditoría detallada sobre el estado actual del frontend (Angular) y el backend (Microservicios en Python/FastAPI) para el proyecto AGM, con el fin de guiar y documentar el proceso de integración end-to-end.

---

## 1. Estado Actual del Backend

El backend está compuesto por un conjunto de microservicios desarrollados en **Python** utilizando el framework **FastAPI**, orquestados localmente mediante **Docker Compose**. La arquitectura se divide en 7 microservicios principales (MS-1 a MS-7):

- **MS-1 (Auth):** Puerto `8001`. Administra el control de acceso, registro, generación y renovación de tokens JWT (access_token y refresh_token) y recuperación de contraseñas.
- **MS-2 (Periodos y Materias / Catálogos):** Puerto `8002` (ruta base `/api/v1`). Gestiona periodos académicos, planes de estudio, catálogo de materias, materias ofertadas e importaciones de programación académica.
- **MS-3 (Docentes y Alumnos):** Puerto `8003` (ruta base `/api/v1`). Controla la información de perfil para docentes y alumnos, inscripciones y la importación de alumnos/docentes desde archivos.
- **MS-4 (Calificaciones):** Puerto `8004` (ruta base `/api/v1`). Administra criterios de ponderación, registro de actividades académicas, importación y asignación de calificaciones y concentrado de notas.
- **MS-5 (Asistencias QR):** Puerto `8005`. Permite el pase de lista interactivo mediante generación de códigos QR dinámicos con tokens temporales cifrados, escaneo de asistencias y registro de historiales.
- **MS-6 (Notificaciones):** Puerto `8006`. Servicio base para notificaciones y alertas (solo `/` healthcheck activo).
- **MS-7 (Reportes y Estadísticas):** Puerto `8007` (ruta base `/api/v1`). Genera reportes en formato binario (PDF y Excel) para calificaciones y asistencias, además de exponer estadísticas individuales de desempeño de alumnos y docentes.

---

## 2. Estado Actual del Frontend

El frontend consiste en una aplicación de página única (SPA) moderna construida con **Angular (v15+)**:

- **Arquitectura de Código:** Utiliza **Standalone Components** y **Signals** para un control reactivo y eficiente del estado.
- **Estructura de Carpetas:**
  - `src/app/core/`: Alberga los componentes transversales como Guards de autenticación (`authGuard`), Interceptors (`jwtInterceptor`) y los Services globales (`AuthService`, `PeriodosService`, `AsistenciasService`).
  - `src/app/features/`: Dividido por roles: `/admin` (Administrador), `/docente` (Profesor), `/alumno` (Estudiante) y pantallas comunes (`/auth`, `/perfil`, `/errors`).
  - `src/app/shared/`: Contiene componentes de UI reutilizables (botones, tarjetas, inputs), directivas, layouts y pipes comunes.
- **Estilos:** Se apoya en **Tailwind CSS** para un diseño moderno, responsivo y fluido.
- **Manejo de Sesión:** Centralizado en `AuthService` utilizando variables en `localStorage` (`agm_token`, `agm_refresh_token` y `agm_user`) y sincronizado mediante un `signal<UserAuth | null>`.
- **Inyección de Tokens:** A través de un `jwtInterceptor` que intercepta todas las peticiones dirigidas a los microservicios agregando la cabecera `Authorization: Bearer <token>`.

---

## 3. Matriz de Endpoints (Postman vs. Código del Backend)

| Microservicio | Endpoint (Contrato Esperado) | Estado en Backend | Detalle Técnico |
|---|---|---|---|
| **MS-1 Auth** | `POST /auth/login` | **Implementado** | Recibe `{email, contrasena}`. Devuelve tokens y usuario. |
| | `GET /auth/me` | **Implementado** | Retorna datos del usuario autenticado. |
| | `POST /auth/refresh` | **Implementado** | Renueva el `access_token` usando el `refresh_token`. |
| | `POST /auth/logout` | **Implementado** | Invalida la sesión actual. |
| | `POST /auth/forgot-password` | **Implementado** | Solicita envío de token por correo para recuperación. |
| | `POST /auth/reset-password` | **Implementado** | Restablece contraseña recibiendo `{reset_token, nueva_contrasena}`. |
| **MS-2 Periodos**| `GET /periodos` | **Implementado** | Soporta paginación `?page=&limit=`. |
| | `POST /periodos` | **Implementado** | Registra nuevo periodo académico. |
| | `GET /periodos/activo` | **Implementado** | Obtiene el periodo actualmente activo. |
| | `PATCH /periodos/:id/activar`| **Implementado** | Activa un periodo académico. |
| | `DELETE /periodos/:id` | **Implementado** | Eliminación lógica del periodo. |
| **MS-2 Materias**| `GET /planes-estudio` | **Implementado** | Obtiene planes de estudio disponibles. |
| | `GET /materias` | **Implementado** | Filtros `?periodo=&docente_id=&estado=&nrc=`. |
| | `POST /importaciones/programacion-academica` | **Implementado** | Carga programaciones vía FormData (Excel). |
| **MS-3 Usuarios**| `GET /api/v1/docentes` | **Implementado** | Listado completo de docentes. |
| | `PATCH /api/v1/docentes/:id`| **Implementado** | Edición de datos laborales/personales de docente. |
| | `GET /api/v1/alumnos` | **Implementado** | Listado de alumnos paginado `?skip=&limit=`. |
| | `GET /api/v1/inscripciones` | **Implementado** | Obtiene inscripciones filtradas por `alumno_id`. |
| **MS-4 Notas** | `GET /api/v1/ponderaciones/:id`| **Implementado** | Obtiene criterios de evaluación por materia. |
| | `POST /api/v1/ponderaciones/:id`| **Implementado** | Define criterios (`nombre`, `porcentaje`, `orden`). |
| | `POST /api/v1/actividades` | **Implementado** | Registra actividad académica. |
| | `POST /api/v1/calificaciones` | **Implementado** | Guarda/actualiza notas de alumnos. |
| | `GET /api/v1/concentrado/:id` | **Implementado** | Retorna el listado final de notas (actual o histórico). |
| **MS-5 QRs** | `POST /sesiones/iniciar` | **Implementado** | Inicia sesión de asistencia de una materia. |
| | `POST /asistencias/escanear`| **Implementado** | Registra asistencia de alumno enviando QR cifrado. |
| | `GET /asistencias/:id/hoy` | **Implementado** | Asistencias registradas hoy para una materia. |
| **MS-7 Reportes**| `GET /api/v1/reportes/calificaciones/:id` | **Implementado** | Descarga de PDF/Excel. Requiere manejo de Blob. |
| | `GET /api/v1/reportes/asistencias/:id` | **Implementado** | Descarga de PDF/Excel. Requiere manejo de Blob. |

---

## 4. Diagnóstico de Mocks y Pantallas Desconectadas

Tras auditar el código fuente del frontend, se identificaron múltiples inconsistencias e integraciones parciales (mocks funcionales):

1. **Pantalla de Gestión de Docentes (`features/admin/usuarios`):**
   - **Mock en Escritura:** El método `cargarDocentes()` consulta correctamente el backend real, pero la creación (`saveUser()`), edición (`toggleUserStatus()`) y eliminación (`deleteUser()`) se ejecutan únicamente sobre la señal local `usersList()`, perdiendo la persistencia al recargar.
2. **Pantalla de Mis Cursos del Docente (`features/docente/mis-cursos`):**
   - **Desconectada:** La lista de cursos `cursos` se declara vacía (`cursos: Curso[] = []`). El componente no interactúa con ningún servicio y carece de lógica de carga real al inicializarse.
3. **Pantallas del Alumno (`features/alumno`):**
   - Muchas de las vistas clave como el panel de `calificaciones` o `mis-materias` contienen lógica simulada que requiere ser reemplazada por consultas a `MS-3 (inscripciones)` y `MS-4 (calificaciones/concentrado)`.
4. **Flujos de Recuperación de Contraseña (`features/auth`):**
   - Los métodos de `recoverPassword` and `resetPassword` en `AuthService` están incompletos, utilizando valores quemados como token ("mock") en lugar del token real capturado desde la URL en el flujo de restablecimiento.
5. **Reportes y Descargas:**
   - La funcionalidad de exportación está simulada con descargas ficticias en lugar de realizar llamadas al `MS-7` que procesen los streams binarios (Blobs) correctamente.

---

## 5. Riesgos Críticos Detectados

- **CORS (Cross-Origin Resource Sharing):** Al interactuar con 7 puertos locales diferentes, es de suma importancia garantizar que los microservicios tengan configurados los CORS permitiendo el origen del frontend (usualmente `http://localhost:4200`).
- **Mapeo y Disparidad de Identificadores (Mismatches de IDs):** Los campos de ID varían significativamente entre modelos (`docente_id` vs `id_docente` vs `user_id`, `alumno_id` vs `matricula`, `id_materia` vs `materia_id`). La ausencia de normalización de datos causará errores en cascada.
- **Tipos de Respuesta Heterogéneos:** Algunos endpoints del backend devuelven un objeto con estructura `{success, data, message}`, mientras que otros devuelven arrays o datos planos directamente. El cliente HTTP debe lidiar dinámicamente con estas variantes sin provocar fallos de ejecución.
- **Manejo de Descarga de Archivos Binarios:** Los navegadores interpretan las respuestas de descarga de reportes PDF/Excel como JSON por defecto. No configurar las cabeceras `Accept` ni procesar la respuesta como un `Blob` generará archivos corruptos o excepciones JavaScript.

---

## 6. Plan de Trabajo y Cronograma de Integración

Nuestra hoja de ruta consta de 15 pasos obligatorios incrementales, cada uno validado y respaldado con un commit semántico en español:

- [x] **PASO 01:** Auditoría inicial del backend y frontend (Guardado en `docs/integration-audit.md`).
- [ ] **PASO 02:** Configuración de entorno y creación del cliente HTTP base con normalizadores.
- [ ] **PASO 03:** Implementación del servicio real de autenticación (MS-1) y protección de rutas.
- [ ] **PASO 04:** Implementación de servicios de periodos, planes, materias y horarios (MS-2).
- [ ] **PASO 05:** Implementación de servicios de docentes, alumnos e inscripciones (MS-3).
- [ ] **PASO 06:** Implementación de servicios de calificaciones, ponderaciones y actividades (MS-4).
- [ ] **PASO 07:** Implementación de servicios de asistencias QR (MS-5).
- [ ] **PASO 08:** Implementación de servicios de reportes, estadísticas y notificaciones (MS-6 y MS-7).
- [ ] **PASO 09:** Conexión de pantallas del rol de ADMINISTRADOR con servicios reales.
- [ ] **PASO 10:** Conexión de pantallas del rol de DOCENTE con servicios reales.
- [ ] **PASO 11:** Conexión de pantallas del rol de ALUMNO con servicios reales.
- [ ] **PASO 12:** Eliminación total de mocks y datos hardcodeados del frontend.
- [ ] **PASO 13:** Ajustes de interactividad, formularios, modales y retroalimentación (UX/UI).
- [ ] **PASO 14:** Validación funcional end-to-end de flujos reales y generación del reporte de validación.
- [ ] **PASO 15:** Entrega del Reporte Final de Integración.
