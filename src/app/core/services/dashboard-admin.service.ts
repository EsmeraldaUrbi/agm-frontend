import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DocentesService } from './docentes.service';
import { AlumnosService } from './alumnos.service';

export interface DashboardStats {
  totalDocentes: number;
  totalAlumnos: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminService {
  private docentesService = inject(DocentesService);
  private alumnosService = inject(AlumnosService);

  getStats(): Observable<DashboardStats> {
    // Pedimos hasta 10,000 para obtener el total del padrón
    const reqDocentes = this.docentesService.getDocentes({ limit: 10000 });
    const reqAlumnos = this.alumnosService.getAlumnos({ limit: 10000 });

    return forkJoin([reqDocentes, reqAlumnos]).pipe(
      map(([docentes, alumnos]) => {
        return {
          totalDocentes: docentes?.length || 0,
          totalAlumnos: alumnos?.length || 0
        };
      })
    );
  }
}
