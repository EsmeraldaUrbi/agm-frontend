import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizeActividad, normalizeCalificacion, unwrapApiResponse, unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface Criterio {
  nombre: string;
  porcentaje: number;
  orden: number;
}

export interface Ponderacion {
  ponderacion_id?: string;
  materia_id: string;
  criterios: Criterio[];
}

export interface Actividad {
  actividad_id?: string;
  materia_id: string;
  ponderacion_id?: string;
  nombre: string;
  descripcion?: string;
  valor_maximo: number;
  fecha_aplicacion: string;
  estado?: string;
}

export interface Calificacion {
  calificacion_id?: string;
  actividad_id: string;
  alumno_id: string;
  materia_id: string;
  calificacion: number;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalificacionesService {
  private apiClient = inject(ApiClient);
  private baseUrl = API_CONFIG.calificaciones;

  // === PONDERACIONES ===
  // POST /api/v1/ponderaciones/:materia_id
  crearPonderaciones(materiaId: string, criterios: Criterio[]): Observable<Ponderacion> {
    return this.apiClient.post<any>(`${this.baseUrl}/ponderaciones/${materiaId}`, { criterios }).pipe(
      map(res => unwrapApiResponse<Ponderacion>(res))
    );
  }

  // GET /api/v1/ponderaciones/:materia_id
  getPonderaciones(materiaId: string): Observable<Ponderacion | null> {
    return this.apiClient.get<any>(`${this.baseUrl}/ponderaciones/${materiaId}`).pipe(
      map(res => {
        const data = unwrapApiResponse<Ponderacion>(res);
        return data ? data : null;
      })
    );
  }

  // === ACTIVIDADES ===
  // POST /api/v1/actividades
  createActividad(payload: Partial<Actividad>): Observable<Actividad> {
    return this.apiClient.post<any>(`${this.baseUrl}/actividades`, payload).pipe(
      map(res => normalizeActividad(unwrapApiResponse(res)))
    );
  }

  // GET /api/v1/actividades/:actividad_id
  getActividadById(actividadId: string): Observable<Actividad> {
    return this.apiClient.get<any>(`${this.baseUrl}/actividades/${actividadId}`).pipe(
      map(res => normalizeActividad(unwrapApiResponse(res)))
    );
  }

  // GET /api/v1/actividades/materia/:materia_id
  getActividadesByMateria(materiaId: string): Observable<Actividad[]> {
    return this.apiClient.get<any>(`${this.baseUrl}/actividades/materia/${materiaId}`).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeActividad))
    );
  }

  // DELETE /api/v1/actividades/:actividad_id
  deleteActividad(actividadId: string): Observable<void> {
    return this.apiClient.delete<any>(`${this.baseUrl}/actividades/${actividadId}`).pipe(
      map(() => undefined)
    );
  }

  // === CALIFICACIONES ===
  // GET /api/v1/calificaciones/alumno/:alumno_id/materia/:materia_id
  getCalificacionesAlumnoMateria(alumnoId: string, materiaId: string): Observable<Calificacion[]> {
    return this.apiClient.get<any>(`${this.baseUrl}/calificaciones/alumno/${alumnoId}/materia/${materiaId}`).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeCalificacion))
    );
  }

  // GET /api/v1/calificaciones/actividad/:actividad_id
  getCalificacionesByActividad(actividadId: string): Observable<Calificacion[]> {
    return this.apiClient.get<any>(`${this.baseUrl}/calificaciones/actividad/${actividadId}`).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeCalificacion))
    );
  }

  // POST /api/v1/calificaciones
  createCalificacion(payload: Partial<Calificacion>): Observable<Calificacion> {
    return this.apiClient.post<any>(`${this.baseUrl}/calificaciones`, payload).pipe(
      map(res => normalizeCalificacion(unwrapApiResponse(res)))
    );
  }

  // PUT /api/v1/calificaciones/:calificacion_id
  updateCalificacion(calificacionId: string, payload: Partial<Calificacion>): Observable<Calificacion> {
    return this.apiClient.put<any>(`${this.baseUrl}/calificaciones/${calificacionId}`, payload).pipe(
      map(res => normalizeCalificacion(unwrapApiResponse(res)))
    );
  }

  // POST /api/v1/calificaciones/importar
  importarCalificaciones(params: { actividad_id: string; archivo: File }): Observable<any> {
    const formData = new FormData();
    formData.append('actividad_id', params.actividad_id);
    formData.append('archivo', params.archivo);
    return this.apiClient.post<any>(`${this.baseUrl}/calificaciones/importar`, formData);
  }

  getConcentrado(materiaId: string, modo: 'actual' | 'historico' = 'actual'): Observable<any> {
    return this.apiClient.get<any>(`${this.baseUrl}/concentrado/${materiaId}`, { modo }).pipe(
      map(res => unwrapApiResponse<any>(res))
    );
  }

  getRendimientoMateria(materiaId: string): Observable<{ rendimiento_promedio: number }> {
    return this.getConcentrado(materiaId).pipe(
      map(concentrado => {
        const alumnos: any[] = Array.isArray(concentrado?.alumnos) ? concentrado.alumnos : [];
        const promedios = alumnos
          .map((alumno: any): number | null => this.obtenerPromedioAlumno(alumno))
          .filter((promedio: number | null): promedio is number => promedio !== null);

        if (promedios.length === 0) {
          return { rendimiento_promedio: 0 };
        }

        const total = promedios.reduce((sum: number, promedio: number) => sum + promedio, 0);
        return { rendimiento_promedio: total / promedios.length };
      })
    );
  }

  getDistribucionCalificaciones(materiaId: string): Observable<Record<string, number>> {
    return this.getConcentrado(materiaId).pipe(
      map(concentrado => {
        const alumnos: any[] = Array.isArray(concentrado?.alumnos) ? concentrado.alumnos : [];
        const distribucion: Record<string, number> = {
          '9-10': 0,
          '8-8.9': 0,
          '7-7.9': 0,
          '<7': 0
        };

        alumnos
          .map((alumno: any): number | null => this.obtenerPromedioAlumno(alumno))
          .filter((promedio: number | null): promedio is number => promedio !== null)
          .forEach((promedio: number) => {
            if (promedio >= 9) {
              distribucion['9-10']++;
            } else if (promedio >= 8) {
              distribucion['8-8.9']++;
            } else if (promedio >= 7) {
              distribucion['7-7.9']++;
            } else {
              distribucion['<7']++;
            }
          });

        return distribucion;
      })
    );
  }

  private obtenerPromedioAlumno(alumno: any): number | null {
    const valor = alumno?.promedio_final ??
      alumno?.promedio ??
      alumno?.calificacion_final ??
      alumno?.calificacion ??
      alumno?.total ??
      alumno?.nota_final;

    const promedio = Number(valor);
    return Number.isFinite(promedio) ? promedio : null;
  }

  // POST /api/v1/concentrado/:materia_id/cierre
  notificarCierreMateria(materiaId: string): Observable<any> {
    return this.apiClient.post<any>(`${this.baseUrl}/concentrado/${materiaId}/cierre`, {}).pipe(
      map(res => res.data || res)
    );
  }

  // POST /api/v1/concentrado/:materia_id/cierre
  // Cierra el concentrado de calificaciones Y dispara el correo de cierre vía MS-6
  cerrarConcentrado(materiaId: string): Observable<any> {
    return this.apiClient.post<any>(`${this.baseUrl}/concentrado/${materiaId}/cierre`, {}).pipe(
      map(res => res.data || res)
    );
  }
}
