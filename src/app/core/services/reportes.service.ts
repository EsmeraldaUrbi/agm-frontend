import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { unwrapApiResponse } from '../helpers/apiResponse.helpers';

export interface EstadisticasAlumno {
  promedio_general: number;
  total_materias: number;
  materias_aprobadas: number;
  materias_reprobadas: number;
  porcentaje_asistencia: number;
}

export interface EstadisticasMateria {
  periodo_id: string;
  periodo_nombre: string;
  materia_id: string;
  materia_nombre: string;
  nrc: string;
  promedio_grupal: number;
  aprobados: number;
  reprobados: number;
  porcentaje_asistencia: number;
}

export interface EstadisticasPeriodo {
  periodo_id: string;
  periodo_nombre: string;
  materias: EstadisticasMateria[];
}

export interface EstadisticasDocenteResponse {
  success: boolean;
  periodos: EstadisticasPeriodo[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiClient = inject(ApiClient);
  private baseUrl = API_CONFIG.reportes;

  // GET /api/v1/estadisticas/alumno/:alumno_id
  getEstadisticasAlumno(alumnoId: string): Observable<EstadisticasAlumno> {
    return this.apiClient.get<any>(`${this.baseUrl}/api/v1/estadisticas/alumno/${alumnoId}`).pipe(
      map(res => unwrapApiResponse<EstadisticasAlumno>(res))
    );
  }

  // GET /api/v1/estadisticas/docente/:docente_id
  getEstadisticasDocente(docenteId: string): Observable<EstadisticasDocenteResponse> {
    return this.apiClient.get<any>(`${this.baseUrl}/api/v1/estadisticas/docente/${docenteId}`).pipe(
      map(res => unwrapApiResponse<EstadisticasDocenteResponse>(res))
    );
  }

  // GET /api/v1/estadisticas/docente/:docente_id
  getResumenMateriasDocente(docenteId: string): Observable<any> {
    return this.getEstadisticasDocente(docenteId);
  }

  // GET /api/v1/reportes/calificaciones/:materia_id?formato=pdf|xlsx
  descargarReporteCalificaciones(materiaId: string, formato: 'pdf' | 'xlsx'): Observable<Blob> {
    const url = `${this.baseUrl}/api/v1/reportes/calificaciones/${materiaId}`;
    return this.apiClient.download(url, { formato });
  }

  // GET /api/v1/reportes/asistencias/:materia_id?formato=pdf|xlsx
  descargarReporteAsistencias(materiaId: string, formato: 'pdf' | 'xlsx'): Observable<Blob> {
    const url = `${this.baseUrl}/api/v1/reportes/asistencias/${materiaId}`;
    return this.apiClient.download(url, { formato });
  }
}
