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
  fecha_inscripcion?: string;
  // Campos cruzados de la materia cargados por el backend
  materia?: {
    nombre: string;
    nrc: string;
    seccion: string;
    periodo_id?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionesService {
  private apiClient = inject(ApiClient);
  private apiUrl = `${API_CONFIG.usuarios}/api/v1/inscripciones`;

  // GET /api/v1/inscripciones/?alumno_id=
  getInscripcionesByAlumno(alumnoId: string): Observable<Inscripcion[]> {
    return this.apiClient.get<any>(`${this.apiUrl}/`, { alumno_id: alumnoId }).pipe(
      map(res => unwrapArrayResponse<Inscripcion>(res))
    );
  }
}
