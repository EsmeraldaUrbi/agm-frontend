import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MateriasService } from './materias.service';
import { PeriodosService } from './periodos.service';
import { PlanesEstudioService } from './planes-estudio.service';

export interface MateriaContextoAcademico {
  materia_id: string;
  nrc: string;
  nombre: string;
  seccion: string;
  horario: string;
  programa: string;
  periodo: string;
  estado?: string;
  docente_id?: string;
  periodo_id?: string;
  plan_estudio_id?: string;
  raw: any;
}

@Injectable({
  providedIn: 'root'
})
export class MateriaContextService {
  private materiasService = inject(MateriasService);
  private periodosService = inject(PeriodosService);
  private planesEstudioService = inject(PlanesEstudioService);

  getContextoMateria(materiaId: string): Observable<MateriaContextoAcademico> {
    return this.materiasService.getMateriaById(materiaId).pipe(
      switchMap((materia: any) => {
        return forkJoin({
          materia: of(materia),
          periodoNombre: this.resolverPeriodoNombre(materia),
          planNombre: this.resolverPlanEstudioNombre(materia)
        });
      }),
      map(({ materia, periodoNombre, planNombre }) => ({
        materia_id: String(materia?.materia_id || materia?.id || materiaId),
        nrc: materia?.nrc || 'N/A',
        nombre: materia?.nombre || materia?.materia?.nombre || 'Materia sin nombre',
        seccion: materia?.seccion || '001',
        horario: this.formatearHorario(materia?.horarios || []),
        programa: planNombre,
        periodo: periodoNombre,
        estado: materia?.estado || materia?.estado_materia,
        docente_id: materia?.docente_id,
        periodo_id: materia?.periodo_id || materia?.id_periodo,
        plan_estudio_id: materia?.plan_estudio_id || materia?.id_plan_estudio || materia?.plan_id,
        raw: materia
      }))
    );
  }

  private resolverPeriodoNombre(materia: any): Observable<string> {
    const nombreDirecto =
      materia?.periodo?.nombre ||
      materia?.periodo_nombre ||
      materia?.nombre_periodo;

    if (nombreDirecto) {
      return of(nombreDirecto);
    }

    const periodoId = materia?.periodo_id || materia?.id_periodo;

    if (!periodoId) {
      return of('Periodo no disponible');
    }

    return this.periodosService.getPeriodoById(String(periodoId)).pipe(
      map(periodo => periodo?.nombre || 'Periodo no disponible'),
      catchError((err) => {
        console.error('Error al resolver periodo de la materia:', err);
        return of('Periodo no disponible');
      })
    );
  }

  private resolverPlanEstudioNombre(materia: any): Observable<string> {
    const nombreDirecto =
      materia?.programa ||
      materia?.plan_estudio?.nombre ||
      materia?.plan?.nombre ||
      materia?.plan_nombre ||
      materia?.nombre_plan ||
      materia?.carrera ||
      materia?.tipo_formacion;

    if (nombreDirecto && String(nombreDirecto).trim()) {
      return of(String(nombreDirecto).trim());
    }

    const planId =
      materia?.plan_estudio_id ||
      materia?.id_plan_estudio ||
      materia?.plan_id;

    if (planId) {
      return this.materiasService.getPlanEstudioById(String(planId)).pipe(
        map(plan => plan?.nombre || plan?.codigo || 'Plan de estudio no disponible'),
        catchError((err) => {
          console.error('Error al resolver plan de estudio de la materia:', err);
          return of('Plan de estudio no disponible');
        })
      );
    }

    const planes = Array.isArray(materia?.planes_estudio)
      ? materia.planes_estudio.filter(Boolean)
      : [];

    if (planes.length > 0) {
      return of(planes.join(', '));
    }

    const materiaCatalogoId =
      materia?.materia_catalogo_id ||
      materia?.materia?.materia_catalogo_id ||
      materia?.materia_catalogo?.materia_catalogo_id ||
      materia?.catalogo?.materia_catalogo_id;

    const claveMateria =
      materia?.clave ||
      materia?.materia?.clave ||
      materia?.materia_catalogo?.clave ||
      materia?.catalogo?.clave;

    const nombreMateria =
      materia?.nombre ||
      materia?.materia?.nombre ||
      materia?.materia_catalogo?.nombre ||
      materia?.catalogo?.nombre;

    if (!materiaCatalogoId && !claveMateria && !nombreMateria) {
      return of('Plan de estudio no disponible');
    }

    return this.planesEstudioService.getPlanesEstudio(1, 100, true).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.items || [])),
      switchMap((planesActivos: any[]) => {
        if (!planesActivos.length) {
          return of('Plan de estudio no disponible');
        }

        const consultas = planesActivos.map((plan: any) => {
          const planEstudioId = plan?.plan_estudio_id || plan?.id;

          if (!planEstudioId) {
            return of(null);
          }

          return this.planesEstudioService.getMateriasPorPlan(String(planEstudioId), 1, 100).pipe(
            map((res: any) => {
              const materiasPlan = Array.isArray(res) ? res : (res?.items || res?.data || []);

              const existeRelacion = materiasPlan.some((item: any) => {
                const catalogoId =
                  item?.materia_catalogo_id ||
                  item?.materia?.materia_catalogo_id ||
                  item?.materia_catalogo?.materia_catalogo_id ||
                  item?.id;

                const clave =
                  item?.clave ||
                  item?.materia?.clave ||
                  item?.materia_catalogo?.clave;

                const nombre =
                  item?.nombre ||
                  item?.materia?.nombre ||
                  item?.materia_catalogo?.nombre;

                const coincidePorId =
                  materiaCatalogoId && catalogoId &&
                  String(catalogoId) === String(materiaCatalogoId);

                const coincidePorClave =
                  claveMateria && clave &&
                  String(clave).trim().toLowerCase() === String(claveMateria).trim().toLowerCase();

                const coincidePorNombre =
                  nombreMateria && nombre &&
                  String(nombre).trim().toLowerCase() === String(nombreMateria).trim().toLowerCase();

                return coincidePorId || coincidePorClave || coincidePorNombre;
              });

              return existeRelacion ? (plan?.nombre || plan?.codigo || null) : null;
            }),
            catchError(() => of(null))
          );
        });

        return forkJoin(consultas).pipe(
          map((nombres: Array<string | null>) => {
            const encontrados = nombres.filter((n): n is string => !!n);
            return encontrados.length
              ? encontrados.join(', ')
              : 'Plan de estudio no disponible';
          })
        );
      }),
      catchError((err) => {
        console.error('Error al resolver plan por relaciones de planes de estudio:', err);
        return of('Plan de estudio no disponible');
      })
    );
  }

  private formatearHorario(horarios: any[]): string {
    if (!Array.isArray(horarios) || horarios.length === 0) {
      return 'Horario no definido';
    }

    const gruposHorarios: { [key: string]: string[] } = {};

    horarios.forEach((h: any) => {
      const ini = h.hora_inicio?.substring(0, 5) || '';
      const fin = h.hora_fin?.substring(0, 5) || '';
      const rango = `${ini} - ${fin}`;
      const dia = h.dia || h.dia_semana || 'Día no definido';

      if (!gruposHorarios[rango]) gruposHorarios[rango] = [];
      gruposHorarios[rango].push(dia);
    });

    return Object.entries(gruposHorarios)
      .map(([rango, dias]) => `${dias.join(', ')} ${rango}`)
      .join(' | ');
  }
}
