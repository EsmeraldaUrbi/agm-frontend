import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MateriasService } from '../../../core/services/materias.service';
import { PeriodosService } from '../../../core/services/periodos.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

type EstadoMateria = 'activa' | 'cerrada' | 'finalizada';

@Component({
  selector: 'app-cierre-materia',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cierre-materia.component.html'
})
export class CierreMateriaComponent {
  // Estado actual de la materia — cambia el UI dinámicamente
  // 'activa'    → Puede cerrarse (notifica alumnos por correo)
  // 'cerrada'   → Cerrada, puede recibir cambios hasta imprimir acta
  // 'finalizada'→ Acta impresa, no acepta más cambios
  estadoMateria = signal<EstadoMateria>('activa');

  materia = signal<any>({
    materia_id: '',
    nrc: '',
    nombre: 'Cargando materia...',
    seccion: '',
    horario: 'Sin horario asignado',
    programa: 'Cargando programa...',
    periodo: 'Cargando periodo...',
    alumnos: 0,
    promedioGrupal: 0,
    asistencias: null
  });

  // Estado de la operación de cierre
  cerrando = signal<boolean>(false);
  errorCierre = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService,
    private calificacionesService: CalificacionesService,
    private periodosService: PeriodosService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDatosMateria(id);
      }
    });
  }

  cargarDatosMateria(id: string) {
    this.materiasService.getMateriaById(id).pipe(
      switchMap((data: any) => forkJoin({
        materia: of(data),
        rendimiento: this.calificacionesService.getRendimientoMateria(id).pipe(
          map(res => ({ ...res, disponible: true })),
          catchError(() => of({ rendimiento_promedio: 0, disponible: false }))
        ),
        periodoNombre: this.resolverPeriodoNombre(data),
        planNombre: this.resolverPlanEstudioNombre(data)
      }))
    ).subscribe({
      next: ({ materia: data, rendimiento, periodoNombre, planNombre }) => {
        let horarioFormat = 'Horario no definido';

        if ((data as any).horarios && (data as any).horarios.length > 0) {
          const gruposHorarios: { [key: string]: string[] } = {};

          (data as any).horarios.forEach((h: any) => {
            const ini = h.hora_inicio?.substring(0, 5) || '';
            const fin = h.hora_fin?.substring(0, 5) || '';
            const rango = `${ini} - ${fin}`;
            const dia = h.dia || h.dia_semana || 'Día no definido';

            if (!gruposHorarios[rango]) gruposHorarios[rango] = [];
            gruposHorarios[rango].push(dia);
          });

          const partes = Object.entries(gruposHorarios).map(([rango, dias]) => {
            return `${dias.join(', ')} ${rango}`;
          });

          horarioFormat = partes.join(' | ');
        }

        const promedioReal = rendimiento?.rendimiento_promedio ?? 0;
        const concentradoConsultado = Boolean((rendimiento as any)?.disponible);

        this.materia.set({
          materia_id: id,
          nrc: (data as any).nrc || 'N/A',
          nombre: (data as any).nombre || 'Materia sin nombre',
          seccion: (data as any).seccion || '001',
          alumnos: (data as any).alumnos_inscritos || (data as any).alumnos || 0,
          promedioGrupal: Number(promedioReal.toFixed(1)),
          asistencias: null, // Se puede conectar a MS-5 en una fase posterior
          horario: horarioFormat,
          programa: planNombre,
          periodo: periodoNombre
        });

        this.actualizarChecklist('Datos de materia cargados', true);
        this.actualizarChecklist('Concentrado consultado', concentradoConsultado);
      },
      error: (err) => {
        console.error('Error al cargar la materia', err);
      }
    });
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

    if (nombreDirecto) {
      return of(nombreDirecto);
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

    return of('Plan de estudio no disponible');
  }

  checklist = [
    { label: 'Datos de materia cargados', completado: false },
    { label: 'Concentrado consultado', completado: false },
    { label: 'Cierre aceptado por backend', completado: false },
    { label: 'Acta final impresa', completado: false },
  ];

  private actualizarChecklist(label: string, completado: boolean) {
    const item = this.checklist.find(item => item.label === label);
    if (item) {
      item.completado = completado;
    }
  }

  // Modal de confirmación
  mostrarModalCierre = false;
  mostrarModalActa = false;

  abrirModalCierre() {
    this.errorCierre.set(null);
    this.mostrarModalCierre = true;
  }

  confirmarCierre() {
    const materiaId = this.materia().materia_id;
    if (!materiaId) return;

    this.cerrando.set(true);
    this.errorCierre.set(null);

    this.calificacionesService.cerrarConcentrado(materiaId).subscribe({
      next: () => {
        this.cerrando.set(false);
        this.estadoMateria.set('cerrada');
        this.actualizarChecklist('Cierre aceptado por backend', true);
        this.mostrarModalCierre = false;
      },
      error: (err) => {
        this.cerrando.set(false);
        this.mostrarModalCierre = false;

        // Interpretar el error correctamente sin redirigir
        const status = err?.status;
        const mensaje = err?.error?.message || err?.error?.detail || err?.message;

        if (status === 400) {
          this.errorCierre.set(
            mensaje || 'No se puede cerrar la materia: verifica que todas las calificaciones estén registradas.'
          );
        } else if (status === 403) {
          // 403 de negocio ≠ 403 de permisos de rol
          // El interceptor ya redirige a /acceso-denegado si el backend devuelve 403 genérico.
          // Por eso, el backend del concentrado debería devolver 400 o 422 para errores de validación.
          this.errorCierre.set(
            mensaje || 'Error al cerrar la materia: verifica que la materia tenga ponderaciones configuradas.'
          );
        } else if (status === 404) {
          this.errorCierre.set('No se encontró el concentrado de calificaciones para esta materia.');
        } else if (status === 422) {
          this.errorCierre.set(
            mensaje || 'Validación fallida: verifica que todas las ponderaciones y calificaciones estén completas.'
          );
        } else {
          this.errorCierre.set(
            mensaje || `Error inesperado (${status}). Intente de nuevo o contacte a soporte.`
          );
        }

        console.error('Error al cerrar concentrado:', err);
      }
    });
  }

  abrirModalActa() {
    this.mostrarModalActa = true;
  }

  confirmarImpresionActa() {
    // Al confirmar, la materia queda finalizada y no acepta más cambios
    // Llamada a MS-7: GET /reportes/calificaciones/:materiaId?formato=pdf
    this.actualizarChecklist('Acta final impresa', true);
    this.estadoMateria.set('finalizada');
    this.mostrarModalActa = false;
  }

  cancelarModal() {
    this.mostrarModalCierre = false;
    this.mostrarModalActa = false;
  }

  get esCerrada() { return this.estadoMateria() === 'cerrada'; }
  get esFinalizada() { return this.estadoMateria() === 'finalizada'; }
  get esActiva() { return this.estadoMateria() === 'activa'; }
}
