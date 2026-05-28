export function unwrapApiResponse<T>(response: any): T {
  if (!response) return response;
  if (response.data !== undefined) {
    return response.data;
  }
  return response;
}

export function unwrapArrayResponse<T>(response: any): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data) {
    if (Array.isArray(response.data)) return response.data;
    if (response.data.items && Array.isArray(response.data.items)) return response.data.items;
    if (response.data.results && Array.isArray(response.data.results)) return response.data.results;
  }
  if (response.items && Array.isArray(response.items)) return response.items;
  if (response.results && Array.isArray(response.results)) return response.results;
  return [];
}

export function getEntityId(entity: any): string | number | undefined {
  if (!entity) return undefined;
  return (
    entity.id ||
    entity.user_id ||
    entity.usuario_id ||
    entity.docente_id ||
    entity.id_docente ||
    entity.alumno_id ||
    entity.id_alumno ||
    entity.periodo_id ||
    entity.materia_id ||
    entity.materia_ofertada_id ||
    entity.id_materia ||
    entity.id_sesion ||
    entity.sesion_id ||
    entity.actividad_id ||
    entity.calificacion_id ||
    entity.asistencia_id
  );
}

export function normalizeUser(user: any): any {
  if (!user) return null;
  const user_id = user.user_id || user.id || user.usuario_id;
  const email = user.email || user.correo;
  const rol = user.rol || user.role;
  const nombre_completo = user.nombre_completo || user.nombre || user.name;
  return {
    user_id,
    email,
    rol,
    activo: user.activo !== undefined ? user.activo : true,
    nombre_completo
  };
}

export function normalizeMateria(materia: any): any {
  if (!materia) return null;
  const materia_id = materia.materia_id || materia.materia_ofertada_id || materia.id_materia || materia.id;
  const nrc = materia.nrc;
  const seccion = materia.seccion;
  const estado = materia.estado || materia.estado_materia || 'ACTIVA';
  const docente_id = materia.docente_id || materia.id_docente;
  const nombre = materia.nombre || materia.materia?.nombre || materia.materia_catalogo?.nombre;
  return {
    ...materia,
    materia_id,
    nombre,
    nrc,
    seccion,
    estado,
    docente_id,
    planes_estudio: materia.planes_estudio || []
  };
}

export function normalizeDocente(docente: any): any {
  if (!docente) return null;
  const docente_id = docente.docente_id || docente.id_docente || docente.id;
  const user_id = docente.user_id || docente.usuario_id;
  const email = docente.correo || docente.email;
  const nombre_completo = docente.nombre_completo || docente.nombre;
  return {
    docente_id,
    user_id,
    email,
    nombre_completo,
    cubiculo: docente.cubiculo || '',
    estatus_laboral: docente.estatus_laboral !== undefined ? docente.estatus_laboral : true
  };
}

export function normalizeAlumno(alumno: any): any {
  if (!alumno) return null;
  const alumno_id = alumno.alumno_id || alumno.id_alumno || alumno.id;
  const user_id = alumno.user_id || alumno.usuario_id;
  const correo = alumno.correo || alumno.email;
  const nombre_completo = alumno.nombre_completo || alumno.nombre;
  return {
    alumno_id,
    user_id,
    correo,
    nombre_completo,
    matricula: alumno.matricula || '',
    tipo_formacion: alumno.tipo_formacion || '',
    estatus_academico: alumno.estatus_academico
  };
}

export function normalizePeriodo(periodo: any): any {
  if (!periodo) return null;
  const periodo_id = periodo.periodo_id || periodo.id;
  return {
    periodo_id,
    nombre: periodo.nombre,
    fecha_inicio: periodo.fecha_inicio,
    fecha_fin: periodo.fecha_fin,
    activo: periodo.activo !== undefined ? periodo.activo : false
  };
}

export function normalizeActividad(actividad: any): any {
  if (!actividad) return null;
  const actividad_id = actividad.actividad_id || actividad.id;
  return {
    actividad_id,
    materia_id: actividad.materia_id || actividad.id_materia,
    ponderacion_id: actividad.ponderacion_id,
    nombre: actividad.nombre,
    descripcion: actividad.descripcion || '',
    valor_maximo: actividad.valor_maximo,
    fecha_aplicacion: actividad.fecha_aplicacion,
    estado: actividad.estado || 'activa'
  };
}

export function normalizeCalificacion(calificacion: any): any {
  if (!calificacion) return null;
  const calificacion_id = calificacion.calificacion_id || calificacion.id;
  return {
    calificacion_id,
    actividad_id: calificacion.actividad_id,
    alumno_id: calificacion.alumno_id || calificacion.id_alumno,
    materia_id: calificacion.materia_id || calificacion.id_materia,
    calificacion: calificacion.calificacion,
    observaciones: calificacion.observaciones || ''
  };
}

export function normalizeAsistencia(asistencia: any): any {
  if (!asistencia) return null;
  const asistencia_id = asistencia.asistencia_id || asistencia.id || asistencia.id_asistencia;
  const estado = asistencia.estado || asistencia.estado_asistencia || asistencia.asistencia_estado;
  return {
    ...asistencia,
    asistencia_id,
    sesion_id: asistencia.sesion_id || asistencia.id_sesion,
    materia_id: asistencia.materia_id || asistencia.id_materia,
    alumno_id: asistencia.alumno_id || asistencia.id_alumno,
    fecha_hora_registro: asistencia.fecha_hora_registro,
    estado
  };
}
