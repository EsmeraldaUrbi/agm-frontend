import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Periodo {
  periodo_id?: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

export interface PeriodosPaginatedResponse {
  data: {
    items: Periodo[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}

export interface PeriodoResponse {
  data: Periodo;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PeriodosService {
  private http = inject(HttpClient);
  // URL base para periodos (usando el puerto 8002 de catalogos/periodos-materias)
  private apiUrl = `${environment.msCatalogosUrl}/api/v1/periodos`;

  // Obtener la lista de periodos
  getPeriodos(page: number = 1, limit: number = 10, activo?: boolean): Observable<PeriodosPaginatedResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      
    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }

    return this.http.get<PeriodosPaginatedResponse>(this.apiUrl, { params });
  }

  // Obtener el periodo actualmente activo
  getPeriodoActivo(): Observable<PeriodoResponse> {
    return this.http.get<PeriodoResponse>(`${this.apiUrl}/activo`);
  }

  // Crear un nuevo periodo
  createPeriodo(periodo: Partial<Periodo>): Observable<PeriodoResponse> {
    return this.http.post<PeriodoResponse>(this.apiUrl, periodo);
  }

  // Actualizar un periodo existente
  updatePeriodo(id: string, periodo: Partial<Periodo>): Observable<PeriodoResponse> {
    return this.http.patch<PeriodoResponse>(`${this.apiUrl}/${id}`, periodo);
  }

  // Activar un periodo (desactivará los demás)
  activarPeriodo(id: string): Observable<PeriodoResponse> {
    return this.http.patch<PeriodoResponse>(`${this.apiUrl}/${id}/activar`, {});
  }

  // Desactivar o "eliminar" lógicamente un periodo
  deletePeriodo(id: string): Observable<PeriodoResponse> {
    return this.http.delete<PeriodoResponse>(`${this.apiUrl}/${id}`);
  }
}
