import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizePeriodo, unwrapApiResponse, unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface Periodo {
  periodo_id?: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

export interface PeriodosPaginatedResponse {
  items: Periodo[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class PeriodosService {
  private apiClient = inject(ApiClient);
  private apiUrl = `${API_CONFIG.catalogos}/periodos`;

  // GET /periodos?page=&limit=
  getPeriodos(page: number = 1, limit: number = 10, activo?: boolean): Observable<PeriodosPaginatedResponse> {
    const params: any = { page, limit };
    if (activo !== undefined) {
      params.activo = activo;
    }
    return this.apiClient.get<any>(`${this.apiUrl}/`, params).pipe(
      map(res => {
        // Manejar estructura { success, data: { items, total, page, limit } }
        const unwrapped = unwrapApiResponse<any>(res);
        const items = unwrapArrayResponse<Periodo>(unwrapped).map(normalizePeriodo);
        return {
          items,
          total: unwrapped.total || items.length,
          page: unwrapped.page || page,
          limit: unwrapped.limit || limit
        };
      })
    );
  }

  // GET /periodos/activo
  getPeriodoActivo(): Observable<Periodo | null> {
    return this.apiClient.get<any>(`${this.apiUrl}/activo`).pipe(
      map(res => {
        const data = unwrapApiResponse(res);
        return data ? normalizePeriodo(data) : null;
      })
    );
  }

  // GET /periodos/:periodo_id
  getPeriodoById(periodoId: string): Observable<Periodo> {
    return this.apiClient.get<any>(`${this.apiUrl}/${periodoId}`).pipe(
      map(res => normalizePeriodo(unwrapApiResponse(res)))
    );
  }

  // POST /periodos
  createPeriodo(periodo: Partial<Periodo>): Observable<Periodo> {
    return this.apiClient.post<any>(`${this.apiUrl}/`, periodo).pipe(
      map(res => normalizePeriodo(unwrapApiResponse(res)))
    );
  }

  // PATCH /periodos/:periodo_id
  updatePeriodo(id: string, periodo: Partial<Periodo>): Observable<Periodo> {
    return this.apiClient.patch<any>(`${this.apiUrl}/${id}`, periodo).pipe(
      map(res => normalizePeriodo(unwrapApiResponse(res)))
    );
  }

  // PATCH /periodos/:periodo_id/activar
  activarPeriodo(id: string): Observable<Periodo> {
    return this.apiClient.patch<any>(`${this.apiUrl}/${id}/activar`, {}).pipe(
      map(res => normalizePeriodo(unwrapApiResponse(res)))
    );
  }

  // DELETE /periodos/:periodo_id
  deletePeriodo(id: string): Observable<any> {
    return this.apiClient.delete<any>(`${this.apiUrl}/${id}`);
  }
}
