import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

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

  // MOCK DATA PARA PRUEBAS FRONTEND SIN BACKEND
  private mockPeriodos = signal<Periodo[]>([
    {
      periodo_id: '1',
      nombre: 'Otoño 2025',
      fecha_inicio: '2025-08-15',
      fecha_fin: '2025-12-15',
      activo: false
    },
    {
      periodo_id: '2',
      nombre: 'Primavera 2026',
      fecha_inicio: '2026-01-15',
      fecha_fin: '2026-05-30',
      activo: true
    }
  ]);

  // Obtener la lista de periodos
  getPeriodos(page: number = 1, limit: number = 10, activo?: boolean): Observable<PeriodosPaginatedResponse> {
    let items = this.mockPeriodos();
    if (activo !== undefined) {
      items = items.filter(p => p.activo === activo);
    }
    
    return of({
      data: {
        items: items,
        total: items.length,
        page: page,
        limit: limit
      },
      message: 'Periodos obtenidos con éxito (Mock)'
    }).pipe(delay(300));
  }

  // Obtener el periodo actualmente activo
  getPeriodoActivo(): Observable<PeriodoResponse> {
    const activo = this.mockPeriodos().find(p => p.activo);
    if (activo) {
      return of({ data: activo, message: 'Periodo activo (Mock)' }).pipe(delay(300));
    }
    return of({ data: null as any, message: 'No hay periodo activo (Mock)' }).pipe(delay(300));
  }

  // Crear un nuevo periodo
  createPeriodo(periodo: Partial<Periodo>): Observable<PeriodoResponse> {
    const newPeriodo: Periodo = {
      periodo_id: Math.random().toString(36).substring(2, 9),
      nombre: periodo.nombre || 'Nuevo Periodo',
      fecha_inicio: periodo.fecha_inicio || '',
      fecha_fin: periodo.fecha_fin || '',
      activo: periodo.activo || false
    };

    this.mockPeriodos.update(list => {
      let updatedList = [...list];
      if (newPeriodo.activo) {
        updatedList = updatedList.map(p => ({ ...p, activo: false }));
      }
      return [...updatedList, newPeriodo];
    });

    return of({ data: newPeriodo, message: 'Periodo creado (Mock)' }).pipe(delay(300));
  }

  // Actualizar un periodo existente
  updatePeriodo(id: string, periodo: Partial<Periodo>): Observable<PeriodoResponse> {
    let updatedPeriodo: Periodo | undefined;
    this.mockPeriodos.update(list => {
      let updatedList = [...list];
      if (periodo.activo) {
        updatedList = updatedList.map(p => ({ ...p, activo: false }));
      }
      return updatedList.map(p => {
        if (p.periodo_id === id) {
          updatedPeriodo = { ...p, ...periodo } as Periodo;
          return updatedPeriodo;
        }
        return p;
      });
    });

    if (updatedPeriodo) {
      return of({ data: updatedPeriodo, message: 'Periodo actualizado (Mock)' }).pipe(delay(300));
    }
    return throwError(() => new Error('Periodo no encontrado'));
  }

  // Activar un periodo (desactivará los demás)
  activarPeriodo(id: string): Observable<PeriodoResponse> {
    let activatedPeriodo: Periodo | undefined;
    this.mockPeriodos.update(list => {
      return list.map(p => {
        if (p.periodo_id === id) {
          activatedPeriodo = { ...p, activo: true };
          return activatedPeriodo;
        }
        return { ...p, activo: false };
      });
    });

    if (activatedPeriodo) {
      return of({ data: activatedPeriodo, message: 'Periodo activado (Mock)' }).pipe(delay(300));
    }
    return throwError(() => new Error('Periodo no encontrado'));
  }

  // Desactivar o "eliminar" lógicamente un periodo
  deletePeriodo(id: string): Observable<PeriodoResponse> {
    this.mockPeriodos.update(list => list.filter(p => p.periodo_id !== id));
    // Simular un periodo borrado para la respuesta
    const deletedPeriodo: Periodo = { periodo_id: id, nombre: '', fecha_inicio: '', fecha_fin: '', activo: false };
    return of({ data: deletedPeriodo, message: 'Periodo eliminado (Mock)' }).pipe(delay(300));
  }
}
