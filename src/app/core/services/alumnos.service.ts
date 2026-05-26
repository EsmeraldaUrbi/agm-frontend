import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizeAlumno, unwrapApiResponse, unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface Alumno {
  alumno_id?: string;
  user_id?: string;
  nombre_completo: string;
  correo: string;
  matricula?: string;
  tipo_formacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private apiClient = inject(ApiClient);
  private apiUrl = `${API_CONFIG.usuarios}/api/v1/alumnos`;

  // GET /api/v1/alumnos/?skip=&limit=
  getAlumnos(params?: { skip?: number; limit?: number }): Observable<Alumno[]> {
    return this.apiClient.get<any>(`${this.apiUrl}/`, params).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeAlumno))
    );
  }

  // GET /api/v1/alumnos/:alumno_id
  getAlumnoById(alumnoId: string): Observable<Alumno> {
    return this.apiClient.get<any>(`${this.apiUrl}/${alumnoId}`).pipe(
      map(res => normalizeAlumno(unwrapApiResponse(res)))
    );
  }

  // PATCH /api/v1/alumnos/:alumno_id
  updateAlumno(alumnoId: string, payload: Partial<Alumno>): Observable<Alumno> {
    return this.apiClient.patch<any>(`${this.apiUrl}/${alumnoId}`, payload).pipe(
      map(res => normalizeAlumno(unwrapApiResponse(res)))
    );
  }

  // POST /api/v1/importar/alumnos
  importarAlumnos(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiClient.post<any>(`${API_CONFIG.usuarios}/api/v1/importar/alumnos`, formData);
  }
}
