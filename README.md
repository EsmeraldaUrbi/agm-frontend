# AGM Frontend

## Plataforma de Gestión Escolar

AETHEL Frontend es la aplicación web de la Plataforma de Gestión Escolar AGM. Está desarrollada con Angular y consume las APIs REST del backend, el cual se ejecuta mediante Docker Compose y está dividido en 7 microservicios.

---

## Stack tecnológico

| Componente | Tecnología / versión |
| ---------- | -------------------- |
| Framework principal | Angular `20.3.0` |
| Angular CLI | `20.3.0` |
| TypeScript | `~5.9.2` |
| Package manager | npm `10.9.0` |
| Estilos | Tailwind CSS `3.4.19`, PostCSS, Autoprefixer |
| Gráficas | Chart.js `4.5.1`, ng2-charts `9.0.0` |
| QR | angularx-qrcode `20.0.0`, jsQR `1.4.0` |
| PDF | pdfjs-dist `3.11.174` |
| Alertas | SweetAlert2 |
| Runtime Angular | RxJS `7.8.x`, Zone.js `0.15.x` |

---

## Repositorios relacionados

Frontend:

```bash
https://github.com/EsmeraldaUrbi/agm-frontend.git
```

Backend:

```bash
https://github.com/Kaltum-Viveros/agm-proyecto-final.git
```

---

## Prerrequisitos

Para ejecutar el frontend es necesario tener instalado:

- Git
- Node.js compatible con Angular 20
- npm
- Docker y Docker Compose para levantar el backend
- Navegador web moderno, recomendado Chrome, Edge o Firefox

Verificar versiones instaladas:

```bash
node -v
npm -v
```

El proyecto declara npm `10.9.0` en `package.json`.

---

## Descargar el proyecto

Clonar el repositorio del frontend:

```bash
git clone https://github.com/EsmeraldaUrbi/agm-frontend.git
cd agm-frontend
```

Instalar dependencias:

```bash
npm ci
```

`npm ci` instala las dependencias usando el archivo `package-lock.json`, por lo que es el comando recomendado para ejecutar el proyecto con las mismas versiones usadas durante el desarrollo.

---

## Ejecutar la aplicación

Con el backend ya levantado, entrar a la carpeta del frontend:

```bash
cd agm-frontend
```

Instalar dependencias, en caso de no haberlo hecho antes:

```bash
npm ci
```

Iniciar Angular:

```bash
npm start
```

Abrir la aplicación en el navegador:

```bash
http://localhost:4200
```

---

## Estructura general

```text
frontend-agm/
├── public/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config/
│   │   │   ├── guards/
│   │   │   ├── helpers/
│   │   │   ├── interceptors/
│   │   │   └── services/
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   ├── alumno/
│   │   │   ├── auth/
│   │   │   ├── docente/
│   │   │   └── errors/
│   │   ├── layout/
│   │   └── shared/
│   ├── environments/
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
├── set-env.js
├── tailwind.config.js
└── tsconfig*.json
```

---

## Integración con microservicios

Las URLs de los servicios se centralizan en:

```bash
src/app/core/config/api.config.ts
```

Ese archivo lee la configuración generada en:

```bash
src/environments/environment.ts
```

Los servicios Angular principales son:

| Servicio Angular | Microservicio |
| ---------------- | ------------- |
| `AuthService` | MS-1 Auth |
| `PeriodosService` | MS-2 Periodos y Materias |
| `MateriasService` | MS-2 Periodos y Materias |
| `PlanesEstudioService` | MS-2 Periodos y Materias |
| `DocentesService` | MS-3 Docentes y Alumnos |
| `AlumnosService` | MS-3 Docentes y Alumnos |
| `InscripcionesService` | MS-3 Docentes y Alumnos |
| `CalificacionesService` | MS-4 Calificaciones |
| `AsistenciasService` | MS-5 Asistencias |
| `NotificacionesService` | MS-6 Notificaciones |
| `ReportesService` | MS-7 Reportes |

---

## Flujos principales

### Administrador

El rol administrador permite:

- Consultar dashboard administrativo.
- Gestionar periodos académicos.
- Gestionar planes de estudio.
- Consultar docentes y alumnos.
- Importar docentes desde PDF.
- Importar programación académica.
- Consultar directorio de materias ofertadas.

### Docente

El rol docente permite:

- Consultar dashboard docente.
- Ver materias asignadas.
- Importar alumnos.
- Configurar ponderaciones.
- Crear y administrar actividades.
- Registrar calificaciones manualmente.
- Importar calificaciones.
- Iniciar pase de lista.
- Escanear QR de asistencia.
- Consultar historial de asistencias.
- Descargar reportes de calificaciones y asistencias.
- Cerrar materia.

### Alumno

El rol alumno permite:

- Consultar dashboard del alumno.
- Ver materias inscritas.
- Consultar detalle de calificaciones.
- Solicitar baja de materia.
- Generar QR para asistencia.
- Consultar perfil.

---

## Flujo recomendado para ejecutar todo

1. Abrir Docker.

2. Levantar backend:

```bash
cd agm-proyecto-final
docker compose up -d --build
docker compose ps
```

3. Levantar frontend:

```bash
cd agm-frontend
npm ci
npm start
```

4. Abrir la aplicación:

```bash
http://localhost:4200
```

---