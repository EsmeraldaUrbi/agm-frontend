import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizeDocente, unwrapApiResponse, unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface Docente {
  docente_id?: string;
  id?: string;          // alias devuelto por algunos endpoints
  user_id?: string;
  nombre_completo: string;
  correo: string;
  email?: string;       // campo normalizado por normalizeDocente
  cubiculo?: string;
  estatus_laboral?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocentesService {
  private apiClient = inject(ApiClient);
  private apiUrl = `${API_CONFIG.usuarios}/docentes`;

  // GET /api/v1/docentes
  getDocentes(params?: { limit?: number; skip?: number }): Observable<Docente[]> {
    return this.apiClient.get<any>(`${this.apiUrl}/`, params).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeDocente))
    );
  }

  // GET /api/v1/docentes/:docente_id
  getDocenteById(docenteId: string): Observable<Docente> {
    return this.apiClient.get<any>(`${this.apiUrl}/${docenteId}`).pipe(
      map(res => normalizeDocente(unwrapApiResponse(res)))
    );
  }

  // PUT /api/v1/docentes/:docente_id
  updateDocente(docenteId: string, payload: Partial<Docente>): Observable<Docente> {
    return this.apiClient.put<any>(`${this.apiUrl}/${docenteId}`, payload).pipe(
      map(res => normalizeDocente(unwrapApiResponse(res)))
    );
  }

  // POST /api/v1/importar/docentes
  importarDocentes(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiClient.post<any>(`${API_CONFIG.usuarios}/importar/docentes`, formData);
  }
}
