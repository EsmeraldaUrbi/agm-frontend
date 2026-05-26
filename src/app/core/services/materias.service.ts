import { Injectable, inject } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizeMateria, unwrapApiResponse, unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface PlanEstudio {
  plan_estudio_id?: string;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export interface MateriaCatalogo {
  materia_catalogo_id?: string;
  nombre: string;
  codigo: string;
  creditos: number;
}

export interface Materia {
  materia_id?: string;
  nombre: string;
  nrc: string;
  seccion: string;
  estado: string;
  docente_id?: string;
  periodo_id?: string;
}

export interface Horario {
  materia_horario_id?: string;
  materia_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MateriasService {
  private apiClient = inject(ApiClient);
  private baseUrl = API_CONFIG.catalogos;

  // === PLANES DE ESTUDIO ===
  getPlanesEstudio(): Observable<PlanEstudio[]> {
    return this.apiClient.get<any>(`${this.baseUrl}/planes-estudio`).pipe(
      map(res => unwrapArrayResponse<PlanEstudio>(res))
    );
  }

  createPlanEstudio(payload: Partial<PlanEstudio>): Observable<PlanEstudio> {
    return this.apiClient.post<any>(`${this.baseUrl}/planes-estudio`, payload).pipe(
      map(res => unwrapApiResponse<PlanEstudio>(res))
    );
  }

  getPlanEstudioById(id: string): Observable<PlanEstudio> {
    return this.apiClient.get<any>(`${this.baseUrl}/planes-estudio/${id}`).pipe(
      map(res => unwrapApiResponse<PlanEstudio>(res))
    );
  }

  updatePlanEstudio(id: string, payload: Partial<PlanEstudio>): Observable<PlanEstudio> {
    return this.apiClient.patch<any>(`${this.baseUrl}/planes-estudio/${id}`, payload).pipe(
      map(res => unwrapApiResponse<PlanEstudio>(res))
    );
  }

  deletePlanEstudio(id: string): Observable<any> {
    return this.apiClient.delete<any>(`${this.baseUrl}/planes-estudio/${id}`);
  }

  // === MATERIAS CATÁLOGO ===
  getMateriasCatalogo(params?: any): Observable<MateriaCatalogo[]> {
    return this.apiClient.get<any>(`${this.baseUrl}/materias-catalogo`, params).pipe(
      map(res => unwrapArrayResponse<MateriaCatalogo>(res))
    );
  }

  createMateriaCatalogo(payload: Partial<MateriaCatalogo>): Observable<MateriaCatalogo> {
    return this.apiClient.post<any>(`${this.baseUrl}/materias-catalogo`, payload).pipe(
      map(res => unwrapApiResponse<MateriaCatalogo>(res))
    );
  }

  // === MATERIAS OFERTADAS / REALES ===
  getMaterias(params?: {
    periodo?: string;
    docente_id?: string;
    estado?: string;
    nrc?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    return this.apiClient.get<any>(`${this.baseUrl}/materias`, params).pipe(
      map(res => {
        const unwrapped = unwrapApiResponse<any>(res);
        const items = unwrapArrayResponse<any>(unwrapped).map(normalizeMateria);
        return {
          items,
          total: unwrapped.total || items.length,
          page: unwrapped.page || params?.page || 1,
          limit: unwrapped.limit || params?.limit || 10
        };
      })
    );
  }

  getMateriasByDocente(docenteId: string, params?: { page?: number; limit?: number }): Observable<any> {
    return this.apiClient.get<any>(`${this.baseUrl}/materias/docente/${docenteId}`, params).pipe(
      map(res => {
        const unwrapped = unwrapApiResponse<any>(res);
        const items = unwrapArrayResponse<any>(unwrapped).map(normalizeMateria);
        return {
          items,
          total: unwrapped.total || items.length,
          page: unwrapped.page || params?.page || 1,
          limit: unwrapped.limit || params?.limit || 10
        };
      })
    );
  }

  getMateriaById(materiaId: string): Observable<Materia> {
    return this.apiClient.get<any>(`${this.baseUrl}/materias/${materiaId}`).pipe(
      map(res => normalizeMateria(unwrapApiResponse(res)))
    );
  }

  cancelarMateriaOfertada(materiaOfertadaId: string): Observable<any> {
    return this.apiClient.patch<any>(`${this.baseUrl}/materias-ofertadas/${materiaOfertadaId}/cancelar`, {});
  }

  // === HORARIOS ===
  createHorario(payload: Partial<Horario>): Observable<Horario> {
    return this.apiClient.post<any>(`${this.baseUrl}/materia-horarios`, payload).pipe(
      map(res => unwrapApiResponse<Horario>(res))
    );
  }

  getHorarioById(horarioId: string): Observable<Horario> {
    return this.apiClient.get<any>(`${this.baseUrl}/materia-horarios/${horarioId}`).pipe(
      map(res => unwrapApiResponse<Horario>(res))
    );
  }

  updateHorario(horarioId: string, payload: Partial<Horario>): Observable<Horario> {
    return this.apiClient.patch<any>(`${this.baseUrl}/materia-horarios/${horarioId}`, payload).pipe(
      map(res => unwrapApiResponse<Horario>(res))
    );
  }

  deleteHorario(horarioId: string): Observable<any> {
    return this.apiClient.delete<any>(`${this.baseUrl}/materia-horarios/${horarioId}`);
  }

  // === IMPORTACIÓN DE PROGRAMACIÓN ACADÉMICA ===
  importarProgramacionAcademica(formData: FormData): Observable<any> {
    // Al usar FormData, HttpClient de Angular no requiere que forcemos cabeceras Content-Type
    return this.apiClient.post<any>(`${this.baseUrl}/importaciones/programacion-academica`, formData);
  }
}
