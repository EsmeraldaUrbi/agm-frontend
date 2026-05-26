# Reporte de Interactividad y Experiencia de Usuario (UX) - Proyecto AGM

Este reporte describe las mejoras de interactividad, control de flujos de datos y retroalimentación visual (UX/UI) incorporadas en el frontend para optimizar la experiencia de usuario y la comunicación con el backend real.

---

## 1. Mejoras de Interactividad y UX Incorporadas

### A. Modales con Limpieza de Estado
- **Problema detectado:** Al abrir un modal para edición de docentes y luego cancelarlo, al abrir el modal para creación individual persistían los campos llenos (correo, cubículo, nombre) en el formulario.
- **Solución implementada:** Se integró lógica de limpieza profunda al cerrar y abrir modales de edición. El método `openCreateModal()` resetea explícitamente todas las variables enlazadas (`userId`, `userName`, `userEmail`, `userCubiculo`, `userStatus`). Lo mismo se aplica en `mis-cursos.component.ts` para el modal de confirmación de cierre de materias.

### B. Retroalimentación de Carga (Spinners y Loadings)
- **Problema detectado:** Al iniciar flujos que consumen APIs distribuidas y síncronas entre microservicios (como promedios finales compuestos por múltiples consultas en el panel de alumnos), la pantalla permanecía congelada y sin cambios, provocando que el usuario creyera que la aplicación falló.
- **Solución implementada:** Se introdujeron señales booleanas de carga (`isLoading = signal(false)`) controlando dinámicamente indicadores de spinner y Skeleton-screens. La señal se activa a `true` al lanzar las llamadas HTTP y vuelve a `false` al completarse la suscripción (sea exitosa o con fallo).

### C. Refresco Automático de Tablas y Listas
- **Problema detectado:** Tras realizar una actualización (como cambiar el estatus laboral de un docente o cancelar un curso), los datos de las tablas no se actualizaban inmediatamente, obligando al usuario a recargar manualmente el navegador.
- **Solución implementada:** Las mutaciones exitosas ahora invocan inmediatamente los métodos de consulta física al backend (`this.cargarDocentes()` y `this.cargarCursos(docenteId)`) para rellenar de nuevo las señales reactivas del frontend, reflejando el cambio al instante.

### D. Paginación y Filtros Reactivos
- **Problema detectado:** Si el usuario filtraba docentes en la página 3 por un término específico y el resultado de la búsqueda era de solo 2 elementos (1 sola página), la vista no mostraba ningún docente (se quedaba vacía) debido a que la paginación seguía intentando renderizar la página 3.
- **Solución implementada:** Se añadió el método `resetPagination()` invocado por el evento `ngModelChange` en el template html de filtros. Este método reinicia automáticamente la señal `currentPage` a 1 cuando el usuario escribe en el buscador o cambia los selectores de estatus.

---

## 2. Validación de Formularios y Payloads
- Todos los formularios de entrada validan campos requeridos antes de efectuar envíos al backend (por ejemplo, en la creación y edición de periodos y edición de perfiles de docentes).
- Se agregaron validaciones de negocio en el cliente para la gestión de periodos, asegurando que la fecha de término sea posterior a la fecha de inicio antes de realizar peticiones al microservicio MS-2.
