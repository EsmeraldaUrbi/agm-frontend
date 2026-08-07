import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MateriasService } from '../../../core/services/materias.service';
import { MateriaContextService } from '../../../core/services/materia-context.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { forkJoin, of } from 'rxjs';
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
    estado: '',
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
    private materiaContextService: MateriaContextService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDatosMateria(id);
      }
    });
  }

  cargarDatosMateria(id: string) {
    this.materiaContextService.getContextoMateria(id).pipe(
      switchMap((contexto) => forkJoin({
        contexto: of(contexto),
        rendimiento: this.calificacionesService.getRendimientoMateria(id).pipe(
          map(res => ({ ...res, disponible: true })),
          catchError(() => of({ rendimiento_promedio: 0, disponible: false }))
        )
      }))
    ).subscribe({
      next: ({ contexto, rendimiento }) => {
        const data = contexto.raw || {};
        const promedioReal = rendimiento?.rendimiento_promedio ?? 0;
        const concentradoConsultado = Boolean((rendimiento as any)?.disponible);

        this.materia.set({
          materia_id: contexto.materia_id,
          nrc: contexto.nrc,
          nombre: contexto.nombre,
          seccion: contexto.seccion,
          alumnos: data.alumnos_inscritos || data.alumnos || 0,
          promedioGrupal: Number(promedioReal.toFixed(1)),
          asistencias: null,
          horario: contexto.horario,
          programa: contexto.programa,
          periodo: contexto.periodo,
          estado: contexto.estado || ''
        });

        const estadoReal = String(contexto.estado || '').trim().toUpperCase();
        if (estadoReal === 'CERRADA') {
          this.estadoMateria.set('cerrada');
          this.actualizarChecklist('Cierre aceptado por backend', true);
        }

        this.actualizarChecklist('Datos de materia cargados', true);
        this.actualizarChecklist('Concentrado consultado', concentradoConsultado);
      },
      error: (err) => {
        console.error('Error al cargar contexto académico de la materia', err);
      }
    });
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

  private obtenerMensajeError(err: any, fallback: string): string {
    return String(
      err?.error?.detail ||
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      fallback
    ).trim();
  }

  confirmarCierre() {
    const materiaId = this.materia().materia_id;
    if (!materiaId) return;

    this.cerrando.set(true);
    this.errorCierre.set(null);

    this.calificacionesService.cerrarConcentrado(materiaId).pipe(
      switchMap(() => this.materiasService.cerrarMateriaOfertada(materiaId))
    ).subscribe({
      next: () => {
        this.cerrando.set(false);
        this.estadoMateria.set('cerrada');
        this.actualizarChecklist('Cierre aceptado por backend', true);
        this.mostrarModalCierre = false;
        this.cargarDatosMateria(materiaId);
      },
      error: (err) => {
        this.cerrando.set(false);
        this.mostrarModalCierre = false;

        const status = err?.status;

        if (status === 400) {
          this.errorCierre.set(
            this.obtenerMensajeError(err, 'No se puede cerrar la materia: verifica que existan ponderaciones, actividades y alumnos inscritos. Las calificaciones faltantes se considerarán como 0.')
          );
        } else if (status === 403) {
          this.errorCierre.set(
            this.obtenerMensajeError(err, 'Error al cerrar la materia: verifica permisos o reglas de cierre.')
          );
        } else if (status === 404) {
          this.errorCierre.set(
            this.obtenerMensajeError(err, 'No se encontró la materia o el concentrado de calificaciones.')
          );
        } else if (status === 422) {
          this.errorCierre.set(
            this.obtenerMensajeError(err, 'Validación fallida: verifica que las ponderaciones sumen 100%, que existan actividades y que la materia tenga alumnos inscritos.')
          );
        } else {
          this.errorCierre.set(
            this.obtenerMensajeError(err, `Error inesperado (${status}). Intente de nuevo o contacte a soporte.`)
          );
        }

        console.error('Error al cerrar materia académicamente:', err);
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
