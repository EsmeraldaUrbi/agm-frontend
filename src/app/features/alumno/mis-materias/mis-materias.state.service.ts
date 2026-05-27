import { Injectable, signal } from '@angular/core';

export interface MisMateriasState {
  materias: any[];
  scheduleData: any[];
  lastFetch: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MisMateriasStateService {
  private state = signal<MisMateriasState>({
    materias: [],
    scheduleData: [],
    lastFetch: null
  });

  // Expone señales de solo lectura
  readonly materias = this.state.asReadonly();

  // Guardar datos en caché
  setCache(materias: any[], scheduleData: any[]) {
    this.state.set({
      materias,
      scheduleData,
      lastFetch: Date.now()
    });
  }

  // Obtener estado actual
  getCache() {
    return this.state();
  }

  // Verifica si la caché es válida (ej. menos de 5 minutos)
  hasValidCache(): boolean {
    const current = this.state();
    if (!current.lastFetch || current.materias.length === 0) return false;
    
    const fiveMinutes = 5 * 60 * 1000;
    return (Date.now() - current.lastFetch) < fiveMinutes;
  }

  // Limpiar caché (útil después de una baja o inscripción)
  clearCache() {
    this.state.set({
      materias: [],
      scheduleData: [],
      lastFetch: null
    });
  }
}
