import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
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

  private materiaAlumnosCache = new Map<string, Observable<Alumno[]>>();

  // GET /api/v1/alumnos/?skip=&limit=
  getAlumnos(params?: { skip?: number; limit?: number }): Observable<Alumno[]> {
    return this.apiClient.get<any>(`${this.apiUrl}/`, params).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeAlumno))
    );
  }

  // GET /api/v1/alumnos/materia/:materia_id
  getAlumnosByMateria(materiaId: string): Observable<Alumno[]> {
    if (!this.materiaAlumnosCache.has(materiaId)) {
      const req = this.apiClient.get<any>(`${this.apiUrl}/materia/${materiaId}`).pipe(
        map(res => unwrapArrayResponse<any>(res).map(normalizeAlumno)),
        shareReplay(1)
      );
      this.materiaAlumnosCache.set(materiaId, req);
    }
    return this.materiaAlumnosCache.get(materiaId)!;
  }

  invalidateMateriaAlumnosCache(materiaId: string): void {
    this.materiaAlumnosCache.delete(materiaId);
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
  importarAlumnos(file: File, materiaId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('materia_id', materiaId);
    return this.apiClient.post<any>(`${API_CONFIG.usuarios}/api/v1/importar/alumnos`, formData);
  }

  // DELETE /api/v1/alumnos/:alumno_id/baja?materia_id=:materia_id
  bajaMateria(alumnoId: string, materiaId: string): Observable<any> {
    return this.apiClient.delete<any>(`${this.apiUrl}/${alumnoId}/baja?materia_id=${materiaId}`);
  }
}
