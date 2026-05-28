import { Injectable, inject } from '@angular/core';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';
import { unwrapApiResponse, unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface PlanEstudio {
  plan_estudio_id: string;
  nombre: string;
  activo: boolean;
}

export interface PlanEstudioCreate {
  nombre: string;
  activo?: boolean;
}

export interface PlanEstudioUpdate {
  nombre?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlanesEstudioService {
  private apiClient = inject(ApiClient);
  private baseUrl = API_CONFIG.catalogos + '/planes-estudio';

  getPlanesEstudio(page: number = 1, limit: number = 50, activo?: boolean): Observable<any> {
    let url = `${this.baseUrl}?page=${page}&limit=${limit}`;
    if (activo !== undefined) {
      url += `&activo=${activo}`;
    }
    return this.apiClient.get<any>(url).pipe(
      map(res => {
        const unwrapped = unwrapApiResponse<any>(res);
        const items = unwrapArrayResponse<PlanEstudio>(unwrapped);
        return {
          items,
          total: unwrapped.total || items.length,
          page: unwrapped.page || page,
          limit: unwrapped.limit || limit
        };
      })
    );
  }

  getPlanEstudioById(id: string): Observable<PlanEstudio> {
    return this.apiClient.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => unwrapApiResponse<PlanEstudio>(res))
    );
  }

  createPlanEstudio(data: PlanEstudioCreate): Observable<PlanEstudio> {
    return this.apiClient.post<any>(this.baseUrl, data).pipe(
      map(res => unwrapApiResponse<PlanEstudio>(res))
    );
  }

  updatePlanEstudio(id: string, data: PlanEstudioUpdate): Observable<PlanEstudio> {
    return this.apiClient.patch<any>(`${this.baseUrl}/${id}`, data).pipe(
      map(res => unwrapApiResponse<PlanEstudio>(res))
    );
  }

  deactivatePlanEstudio(id: string): Observable<PlanEstudio> {
    return this.apiClient.delete<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => unwrapApiResponse<PlanEstudio>(res))
    );
  }

  // === GESTIÓN DE MATERIAS POR PLAN ===

  getMateriasPorPlan(planEstudioId: string, page: number = 1, limit: number = 100): Observable<any> {
    const url = `${API_CONFIG.catalogos}/materias-planes-estudio?plan_estudio_id=${planEstudioId}&page=${page}&limit=${limit}`;
    return this.apiClient.get<any>(url).pipe(
      map(res => {
        const unwrapped = unwrapApiResponse<any>(res);
        const items = unwrapArrayResponse<any>(unwrapped);
        return {
          items,
          total: unwrapped.total || items.length,
          page: unwrapped.page || page,
          limit: unwrapped.limit || limit
        };
      })
    );
  }

  asignarMateriaAPlan(planEstudioId: string, materiaCatalogoId: string): Observable<any> {
    const url = `${API_CONFIG.catalogos}/materias-planes-estudio`;
    return this.apiClient.post<any>(url, {
      plan_estudio_id: planEstudioId,
      materia_catalogo_id: materiaCatalogoId,
      activa: true
    }).pipe(
      map(res => unwrapApiResponse<any>(res))
    );
  }

  removerMateriaDePlan(materiaPlanEstudioId: string): Observable<any> {
    const url = `${API_CONFIG.catalogos}/materias-planes-estudio/${materiaPlanEstudioId}`;
    return this.apiClient.delete<any>(url).pipe(
      map(res => unwrapApiResponse<any>(res))
    );
  }
}
