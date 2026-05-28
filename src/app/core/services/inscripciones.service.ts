import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface Inscripcion {
  inscripcion_id?: string;
  alumno_id: string;
  materia_id: string;
  docente_id?: string;
  periodo_id?: string;
  nrc_materia?: string;
  seccion_materia?: string;
  fecha_inscripcion?: string;
  // Campos cruzados de la materia cargados por el backend
  materia?: {
    nombre: string;
    nrc: string;
    seccion: string;
    periodo_id?: string;
  };
  activa?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionesService {
  private apiClient = inject(ApiClient);
  private apiUrl = `${API_CONFIG.usuarios}/inscripciones`;

  // GET /api/v1/inscripciones/?alumno_id=
  getInscripcionesByAlumno(alumnoId: string): Observable<Inscripcion[]> {
    return this.apiClient.get<any>(`${this.apiUrl}/`, { alumno_id: alumnoId }).pipe(
      map(res => unwrapArrayResponse<Inscripcion>(res))
    );
  }

  // GET /api/v1/inscripciones/?docente_id=
  getTotalAlumnosDocente(docenteId: string): Observable<{ total_alumnos: number }> {
    return this.apiClient.get<any>(`${this.apiUrl}/`, { docente_id: docenteId }).pipe(
      map(res => ({
        total_alumnos: unwrapArrayResponse<Inscripcion>(res).length
      }))
    );
  }
}
